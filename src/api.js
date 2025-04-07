// src/api.js
const API_URL = "https://script.google.com/macros/s/AKfycbwdoHSHF6HA1YBvmviZllzGM_rVmLzYPQpXE6xuZu5uY3P-eUx8Y8YPGS_Z2TX8Sonf/exec";

// GET: 월별 가계부 데이터 불러오기
export const fetchBudgetData = async () => {
  const res = await fetch(API_URL);
  return await res.json();
};

// POST: 새 거래 추가
// POST: 새 거래 추가 (폼 방식, CORS 프리플라이트 회피)
export const addTransaction = async (data) => {
    const form = new URLSearchParams();
    for (const key in data) {
      form.append(key, data[key]);
    }
  
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
  
    return await res.json(); // { status: "success" }
  };

// 예산 저장 (POST)
export const saveMonthlyBudget = async (month, budget) => {
    const form = new URLSearchParams();
    form.append("month", month);
    form.append("budget", budget);
  
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });
  
    return await res.json();
  };
  
  // 예산 + 지출 조회 (GET)
  export const fetchMonthlySummary = async (month) => {
    const res = await fetch(`${API_URL}?mode=budget&month=${month}`);
    if (!res.ok) throw new Error("요청 실패: " + res.status);
    return await res.json(); // 여기서 에러 나면 실제 응답은 JSON 아님
  };