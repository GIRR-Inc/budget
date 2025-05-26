import supabase from "./supabase";


export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username");

  if (error) throw error;
  return data;
};

export const fetchSharedTotalSummary = async (groupId) => {
  if (!groupId) throw new Error("groupId가 필요합니다.");

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      category,
      amount,
      memo,
      date,
      categories (
        code,
        description,
        is_shared_total,
        is_deleted
      )
    `)
    .eq("shared_group_id", groupId);

  if (error) throw error;

  const filtered = data.filter(
    (row) =>
      row.categories &&
      row.categories.is_shared_total === true &&
      row.categories.is_deleted === false
  );

  // 🧮 카테고리별로 묶기
  const grouped = {};
  for (const row of filtered) {
    const code = row.category;
    const name = row.categories.description;
    const amt = Number(row.amount);

    if (!grouped[code]) {
      grouped[code] = { code, name, total: 0, transactions: [] };
    }

    grouped[code].total += amt;
    grouped[code].transactions.push({
      id: row.id,
      amount: amt,
      memo: row.memo,
      date: row.date,
    });
  }

  return Object.values(grouped).sort((a, b) => b.total - a.total);
};



export const fetchBudgetData = async ({ userId = null, groupId = null }) => {
  const matchObj = {
    ...(userId && { user_id: userId }),
    ...(groupId && { shared_group_id: groupId }),
  };

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      id,
      date,
      amount,
      category,
      memo,
      created_at,
      categories (
        description,
        is_deleted
      )
    `)
    .match(matchObj)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map(row => ({
    id: row.id,
    date: row.date,
    amount: row.amount,
    category: row.category,
    category_name: row.categories?.description || "삭제된 카테고리",
    is_deleted: row.categories?.is_deleted === true,
    memo: row.memo,
  }));
};

export const fetchPersonalExpensesForGroupMembers = async (month, memberIds = []) => {

  if (memberIds.length === 0) return {};

  const { data, error } = await supabase
    .from("transactions")
    .select("amount, date, user_id")
    .gte("date", `${month}-01`)
    .lt("date", `${getNextMonth(month)}-01`)
    .in("user_id", memberIds)
    .is("shared_group_id", null); // ✅ 개인 지출만

  if (error) {
    throw error;
  }

  const summary = {};
  for (const row of data) {
    const amt = Number(row.amount);
    if (amt < 0) {
      summary[row.user_id] = (summary[row.user_id] || 0) + -amt;
    }
  }

  return summary;
};



export const fetchGroupMembers = async (groupId) => {

  const { data, error } = await supabase
    .from("shared_group_members")
    .select("user_id, users(username)")
    .eq("shared_group_id", groupId);

  if (error) {
    throw error;
  }

  return data.map((m) => ({
    id: m.user_id,
    username: m.users.username,
  }));
};


// 월별 예산 및 지출 요약
export const fetchMonthlySummary = async (month, userId = null, groupId = null) => {
  const { data: budgetData, error: budgetError } = await supabase
    .from("monthly_budget")
    .select("budget")
    .eq("month", month)
    .match({
      ...(userId && { user_id: userId }),
      ...(groupId && { shared_group_id: groupId })
    })
    .maybeSingle();

  if (budgetError) throw new Error("예산 정보 불러오기 실패");

  const budget = budgetData?.budget || 0;

  const { data: txData, error: txError } = await supabase
    .from("transactions")
    .select("amount, date")
    .gte("date", `${month}-01`)
    .lt("date", `${getNextMonth(month)}-01`)
    .match({
      ...(userId && { user_id: userId }),
      ...(groupId && { shared_group_id: groupId })
    });

  if (txError) throw new Error("지출 내역 불러오기 실패");

  const spent = txData.reduce((sum, row) => {
    const amt = Number(row.amount);
    return sum + (amt < 0 ? -amt : 0);
  }, 0);

  return {
    status: "success",
    month,
    budget,
    spent
  };
};

// 거래 추가
export const addTransaction = async ({ category, amount, memo, date }, userId = null, groupId = null) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert([{
      category,
      amount,
      memo,
      date,
      user_id: userId,
      shared_group_id: groupId,
    }]);

  if (error) throw error;
  return { status: "success" };
};

export const updateTransaction = async (original, updated, userId = null, groupId = null) => {
  const matchConditions = {
    date: original.date,
    amount: original.amount,
    category: original.category,
    memo: original.memo,
    ...(userId && { user_id: userId }),
    ...(groupId && { shared_group_id: groupId }),
  };

  const { error } = await supabase
    .from("transactions")
    .update({
      amount: updated.amount,
      memo: updated.memo,
      category: updated.category,
    })
    .match(matchConditions);

  if (error) throw error;
  return { status: "success" };
};

// 거래 삭제 (id 기준)
export const deleteTransaction = async (id) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id); // 고유 id로 삭제

  if (error) throw error;
  return { status: "success" };
};


// 예산 저장
export const saveMonthlyBudget = async (month, budget, userId = null, groupId = null) => {
  const payload = {
    month,
    budget,
    user_id: userId,
    shared_group_id: groupId
  };

  const { data, error } = await supabase
    .from("monthly_budget")
    .upsert([payload], {
      onConflict: userId ? ["month", "user_id"] : ["month", "shared_group_id"]
    });

  if (error) throw error;
  return { status: "success" };
};


// 월 이름 계산 유틸
function getNextMonth(month) {
  const [year, m] = month.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, m, 1)); // 다음 달 1일의 UTC 날짜
  const kstOffsetMs = 9 * 60 * 60 * 1000; // KST는 UTC+9시간

  const kstDate = new Date(utcDate.getTime() + kstOffsetMs); // KST 기준으로 보정

  const nextYear = kstDate.getFullYear();
  const nextMonth = String(kstDate.getMonth() + 1).padStart(2, "0");

  return `${nextYear}-${nextMonth}`;
}


// 카테고리 전체 불러오기
export const fetchCategories = async ({ userId = null, groupId = null }) => {
  const query = supabase
    .from("categories")
    .select("*")
    .eq("is_deleted", false)
    .order("sort", { ascending: true });

  if (userId) {
    query.eq("user_id", userId);
  } else if (groupId) {
    query.eq("shared_group_id", groupId);
  } else {
    throw new Error("userId 또는 groupId 중 하나는 반드시 필요합니다.");
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// 카테고리 추가
export const addCategory = async (
  { code, description, sort, is_shared_total = false },
  userId = null,
  groupId = null
) => {
  const targetColumn = userId ? "user_id" : "shared_group_id";
  const targetValue = userId ?? groupId;

  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        code,
        description,
        sort,
        [targetColumn]: targetValue,
        is_shared_total, // ✅ 누적보기 상태 저장
      },
    ]);

  if (error) throw error;
  return { status: "success", data };
};

// 카테고리 이름 수정
// 기존 updateCategoryName 함수 대신:
export const updateCategory = async (code, { description, is_shared_total }, userId, groupId) => {
  const { error } = await supabase
    .from("categories")
    .update({ description, is_shared_total })
    .eq("code", code)
    .match({
      ...(userId && { user_id: userId }),
      ...(groupId && { shared_group_id: groupId }),
    });

  if (error) throw error;
  return { status: "success" };
};


export const softDeleteCategory = async (code, userId = null, groupId = null) => {
  const { error } = await supabase
    .from("categories")
    .update({ is_deleted: true })
    .eq("code", code)
    .match({
      ...(userId && { user_id: userId }),
      ...(groupId && { shared_group_id: groupId }),
    });

  if (error) throw error;
  return { status: "success" };
};

// 카테고리 정렬 순서 일괄 업데이트
export const updateCategoriesSort = async (categories, userId = null, groupId = null) => {
  const updates = categories.map(({ code, sort }) =>
    supabase
      .from("categories")
      .update({ sort })
      .eq("code", code)
      .match({
        ...(userId && { user_id: userId }),
        ...(groupId && { shared_group_id: groupId }),
      })
  );

  const results = await Promise.all(updates);
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) throw new Error("정렬 순서 저장 중 오류 발생");

  return { status: "success" };
};

export const deleteCategory = async (code, userId = null, groupId = null) => {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("code", code)
    .match({
      ...(userId && { user_id: userId }),
      ...(groupId && { shared_group_id: groupId }),
    });

  if (error) throw error;
  return { status: "success" };
};

// category별 지출 요약
export const fetchCategorySummary = async (month, userId = null, groupId = null) => {
  const query = supabase
    .from("transactions")
    .select(`
      category,
      amount,
      categories:category ( description )
    `)
    .gte("date", `${month}-01`)
    .lt("date", `${getNextMonth(month)}-01`);

  if (userId) {
    query.eq("user_id", userId);
  } else if (groupId) {
    query.eq("shared_group_id", groupId);
  } else {
    throw new Error("userId 또는 groupId가 필요합니다.");
  }

  const { data, error } = await query;
  if (error) throw error;

  const summaryMap = {};
  data.forEach((tx) => {
    const amt = Number(tx.amount);
    if (amt < 0) {
      const key = tx.category;
      if (!summaryMap[key]) {
        summaryMap[key] = {
          category: key,
          name: tx.categories?.description || "삭제된 카테고리",
          total: 0,
        };
      }
      summaryMap[key].total += -amt;
    }
  });

  return Object.values(summaryMap);
};


export const fetchSharedGroups = async (userId) => {
  const { data, error } = await supabase
    .from("shared_group_members")
    .select(`
      shared_groups (
        id,
        name
      )
    `)
    .eq("user_id", userId);

  if (error) throw error;

  return data.map(d => d.shared_groups); // group 목록만 추출
};

export const createSharedGroup = async (groupName = "우리집") => {
  const { data, error } = await supabase
    .from("shared_groups")
    .insert([{ name: groupName }])
    .select()
    .single(); // 생성된 그룹 ID를 받기 위해

  if (error) throw error;
  return data; // { id, name, created_at }
};

export const addUsersToSharedGroup = async (groupId, userIds = []) => {
  const inserts = userIds.map((uid) => ({
    user_id: uid,
    shared_group_id: groupId,
  }));

  const { error } = await supabase
    .from("shared_group_members")
    .insert(inserts);

  if (error) throw error;
  return { status: "success" };
};
