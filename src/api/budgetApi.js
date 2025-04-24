import supabase from "./supabase";


export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username");

  if (error) throw error;
  return data;
};


// 거래 내역 전체 불러오기 (카테고리 이름 포함)
export const fetchBudgetData = async (userId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      date,
      amount,
      category,
      memo,
      categories (
        description,
        is_deleted
      )
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false }); // 추가된 정렬 기준

  if (error) throw error;

  return data.map(row => ({
    date: row.date,
    amount: row.amount,
    category: row.category,
    category_name: row.categories?.description || "삭제된 카테고리",
    is_deleted: row.categories?.is_deleted === true,
    memo: row.memo,
  }));
};


// 월별 예산 및 지출 요약
export const fetchMonthlySummary = async (month, userId) => {
  const { data: budgetData, error: budgetError } = await supabase
    .from("monthly_budget")
    .select("budget")
    .eq("month", month)
    .eq("user_id", userId)
    .maybeSingle();

  if (budgetError) throw new Error("예산 정보 불러오기 실패");

  const budget = budgetData?.budget || 0;

  const { data: txData, error: txError } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("user_id", userId)
    .gte("date", `${month}-01`)
    .lt("date", `${getNextMonth(month)}-01`);

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
export const addTransaction = async ({ category, amount, memo, date }, userId) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ category, amount, memo, date, user_id: userId }]);

  if (error) throw error;
  return { status: "success" };
};

export const updateTransaction = async (original, updated, userId) => {
  const { error } = await supabase
    .from("transactions")
    .update({
      amount: updated.amount,
      memo: updated.memo,
    })
    .match({
      date: original.date,
      amount: original.amount,
      category: original.category,
      memo: original.memo,
      user_id: userId,  // ✅ 사용자 조건 추가!
    });

  if (error) throw error;
  return { status: "success" };
};

// 거래 삭제
export const deleteTransaction = async (date, amount, category, memo, userId) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .match({
      date,
      amount,
      category,
      memo,
      user_id: userId,  // ✅ 사용자 조건 추가!
    });

  if (error) throw error;
  return { status: "success" };
};

// 예산 저장
export const saveMonthlyBudget = async (month, budget, userId) => {
  const { data, error } = await supabase
    .from("monthly_budget")
    .upsert(
      [{ month, budget, user_id: userId }],
      { onConflict: ["month", "user_id"] } // ✅ 이걸 DB 제약 조건과 맞춰야 작동함
    )

  if (error) throw error;
  return { status: "success" };
};


// 월 이름 계산 유틸
function getNextMonth(month) {
  const [year, m] = month.split("-").map(Number);
  const next = new Date(year, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
}


// 카테고리 전체 불러오기
export const fetchCategories = async (userId) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_deleted", false)
    .eq("user_id", userId)
    .order("sort", { ascending: true });

  if (error) throw error;
  return data;
};

// 카테고리 추가
export const addCategory = async ({ code, description }, userId) => {
  const { data: existing } = await supabase
    .from("categories")
    .select("sort")
    .eq("is_deleted", false)
    .eq("user_id", userId)
    .order("sort", { ascending: false })
    .limit(1);

  const nextSort = existing?.[0]?.sort != null ? existing[0].sort + 1 : 0;

  const { data, error } = await supabase
    .from("categories")
    .insert([{ code, description, sort: nextSort, user_id: userId }]);

  if (error) throw error;
  return { status: "success", data };
};

export const softDeleteCategory = async (code) => {
  const { error } = await supabase
    .from("categories")
    .update({ is_deleted: true })
    .eq("code", code);

  if (error) throw error;
  return { status: "success" };
};

// 카테고리 정렬 순서 일괄 업데이트
export const updateCategoriesSort = async (categories, userId) => {
  const updates = categories.map(({ code, sort }) =>
    supabase
      .from("categories")
      .update({ sort })
      .eq("code", code)
      .eq("user_id", userId)
  );

  const results = await Promise.all(updates);

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) throw new Error("정렬 순서 저장 중 오류 발생");

  return { status: "success" };
};


// 카테고리 삭제
export const deleteCategory = async (code, userId) => {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("code", code)
    .eq("user_id", userId);  // ✅ 필수!

  if (error) throw error;
  return { status: "success" };
};
