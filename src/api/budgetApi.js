import supabase from "./supabase";

// 거래 내역 전체 불러오기 (카테고리 이름 포함)
export const fetchBudgetData = async () => {
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
    .order("date", { ascending: false });

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
export const fetchMonthlySummary = async (month) => {
  // 예산 불러오기
  const { data: budgetData, error: budgetError } = await supabase
  .from("monthly_budget")
  .select("budget")
  .eq("month", month)
  .maybeSingle(); // ← 여기를 수정

  if (budgetError) throw new Error("예산 정보 불러오기 실패");

  const budget = budgetData?.budget || 0;

  // 해당 월 거래 가져오기
  const { data: txData, error: txError } = await supabase
    .from("transactions")
    .select("amount, date")
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
export const addTransaction = async ({ category, amount, memo, date }) => {
  const { data, error } = await supabase
    .from("transactions")
    .insert([{ category, amount, memo, date }]);

  if (error) throw error;
  return { status: "success" };
};

export const updateTransaction = async (original, updated) => {
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
    });

  if (error) throw error;
  return { status: "success" };
};

// 거래 삭제
export const deleteTransaction = async (date, amount, category, memo) => {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .match({ date, amount, category, memo });

  if (error) throw error;
  return { status: "success" };
};

// 예산 저장
export const saveMonthlyBudget = async (month, budget) => {
    const { data, error } = await supabase
      .from("monthly_budget")
      .upsert([{ month, budget }], { onConflict: ['month'] }); // ← 여기!
  
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
export const fetchCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_deleted", false) // 삭제된 항목 제외
    .order("sort", { ascending: true });

  if (error) throw error;
  return data;
};

// 카테고리 추가
export const addCategory = async ({ code, description, sort }) => {
  const { data, error } = await supabase
    .from("categories")
    .insert([{ code, description, sort }]);

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


// 카테고리 삭제
export const deleteCategory = async (code) => {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("code", code);

  if (error) throw error;
  return { status: "success" };
};
