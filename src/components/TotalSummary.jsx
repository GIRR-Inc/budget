import React, { useEffect, useState } from "react";
import { fetchBudgetData } from "../api/budgetApi";
import "./TotalSummary.css";

const TotalSummary = ({ groupId, categories, userColor }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ 누적 보기 대상 카테고리만 필터
  const sharedCategoryCodes = categories
    .filter((c) => c.is_shared_total)
    .map((c) => c.code);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const tx = await fetchBudgetData({ groupId });
        const filtered = tx.filter((t) => sharedCategoryCodes.includes(t.category));
        setData(filtered);
      } catch (err) {
        console.error("누적 보기 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    if (groupId) load();
  }, [groupId, categories]);

  // ✅ 카테고리별 누적합
  const totals = data.reduce((acc, cur) => {
    const key = cur.category;
    const amt = Number(cur.amount);
    if (!acc[key]) acc[key] = { name: cur.category_name, total: 0 };
    acc[key].total += amt;
    return acc;
  }, {});

  const sortedTotals = Object.entries(totals).sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="total-summary">
      <h3 style={{ color: userColor }}>📊 전체 누적 보기 (공동 태그)</h3>

      {loading ? (
        <p>불러오는 중...</p>
      ) : sortedTotals.length === 0 ? (
        <p>해당되는 내역이 없습니다.</p>
      ) : (
        <ul className="total-list">
          {sortedTotals.map(([code, { name, total }]) => (
            <li key={code} className="total-item">
              <span className="cat-name">{name}</span>
              <span className="cat-total">{total.toLocaleString()}원</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TotalSummary;
