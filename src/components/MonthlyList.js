// src/components/MonthlyList.js
import React, { useEffect, useState } from "react";
import { fetchBudgetData } from "../api";
import "./MonthlyList.css"; // 스타일은 따로 작성

const MonthlyList = () => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    fetchBudgetData().then(res => {
      setData(res);
      // 가장 최근 월 자동 선택
      const months = [...new Set(res.map(d => d.date?.slice(0, 7)))].sort().reverse();
      if (months.length > 0) setSelectedMonth(months[0]);
    });
  }, []);

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

      <ul className="list">
        {filtered.map((item, idx) => {
            const amount = Number(item.amount);
            const isExpense = amount < 0;
            const formatted = Math.abs(amount).toLocaleString();

            return (
            <li key={idx} className="item">
                <div className="date">{item.date?.slice(8, 10)}일</div>
                <div className="desc">
                <span className="category">{item.category_name || item.code}</span>
                <span className={`amount ${isExpense ? "expense" : "income"}`}>
                    {isExpense ? "-" : "+"}{formatted}원
                </span>
                </div>
                {item.description && <div className="memo">({item.description})</div>}
            </li>
            );
        })}
        </ul>
    </div>
  );
};

export default MonthlyList;
