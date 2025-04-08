import React, { useEffect, useState } from "react";
import { fetchBudgetData, fetchMonthlySummary } from "../api/budgetApi";
import "./MonthlyList.css";

const MonthlyList = () => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [summary, setSummary] = useState({ budget: 0, spent: 0 });

  useEffect(() => {
    fetchBudgetData().then(res => {
      setData(res);
      const months = [...new Set(res.map(d => d.date?.slice(0, 7)))].sort().reverse();
      if (months.length > 0) setSelectedMonth(months[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    fetchMonthlySummary(selectedMonth).then(res => {
      setSummary({ budget: res.budget, spent: res.spent });
    });
  }, [selectedMonth]);

  const months = [...new Set(data.map(d => d.date?.slice(0, 7)))].sort().reverse();
  const filtered = data.filter(d => d.date?.startsWith(selectedMonth));

  return (
    <div className="monthly-container">
      <div className="tab-bar">
        {months.map(month => (
          <button
            key={month}
            className={`tab ${month === selectedMonth ? "active" : ""}`}
            onClick={() => setSelectedMonth(month)}
          >
            {month}
          </button>
        ))}
      </div>

      <div className="summary-bar">
        <h3>{selectedMonth} 예산 요약</h3>
        <div className="summary-row">
          <span className="label">예산</span>
          <span className="value">{summary.budget.toLocaleString()}원</span>
        </div>
        <div className="summary-row">
          <span className="label">지출</span>
          <span className={`value ${summary.spent > summary.budget ? "over" : ""}`}>
            {summary.spent.toLocaleString()}원
          </span>
        </div>
      </div>


      <ul className="list">
        {filtered.map((item, idx) => {
          const amount = Number(item.amount);
          const isExpense = amount < 0;
          const formatted = Math.abs(amount).toLocaleString();

          return (
            <li key={idx} className="item">
              <div className="date">{item.date?.slice(8, 10)}일</div>
              <div className="desc">
                <span className="category">{item.category_name || item.category}</span>
                <span className={`amount ${isExpense ? "expense" : "income"}`}>
                  {isExpense ? "-" : "+"}{formatted}원
                </span>
              </div>
              {item.memo && <div className="memo">({item.memo})</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MonthlyList;
