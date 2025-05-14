import React, { useEffect, useState } from "react";
import { fetchSharedTotalSummary } from "../api/budgetApi";
import "./TotalSummary.css";

const TotalSummary = ({ groupId, userColor }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const summaryList = await fetchSharedTotalSummary(groupId);
        setData(summaryList);
      } catch (err) {
        console.error("누적 합계 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    if (groupId) load();
  }, [groupId]);

  return (
    <div className="total-summary">
      {loading ? (
        <p>불러오는 중...</p>
      ) : data.length === 0 ? (
        <p>해당되는 내역이 없습니다.</p>
      ) : (
        <ul className="total-list">
          {data.map(({ code, name, total, transactions }) => (
            <li key={code} className="total-item-wrapper">
              <div
                className="total-item"
                onClick={() =>
                  setOpenCategory(openCategory === code ? null : code)
                }
              >
                <span className="cat-name">{name}</span>
                <span className="cat-total">{total.toLocaleString()}원</span>
              </div>

              {openCategory === code && (
                <ul className="transaction-sublist">
                  {transactions.map((tx, idx) => (
                    <li key={idx} className="transaction-item">
                      <span>{tx.date}</span>
                      <span>{tx.memo || "메모 없음"}</span>
                      <span>{tx.amount.toLocaleString()}원</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TotalSummary;
