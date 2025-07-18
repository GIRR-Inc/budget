import React, { useEffect, useState } from "react";
import { fetchSharedTotalSummary } from "../api/budgetApi";
import "./TotalSummary.css";

const TotalSummary = ({ groupId, userColor, onTxClick }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (groupId) {
          const summaryList = await fetchSharedTotalSummary(groupId);
          setData(summaryList);
        } else {
          setData([]); // 개인 사용자일 때는 빈 배열
        }
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
      {!groupId ? (
        <p>그룹에서만 사용할 수 있는 기능입니다.</p>
      ) : loading ? (
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
                    <li
                      key={idx}
                      className="transaction-item"
                      onClick={() => onTxClick?.(tx)} // ⬅️ 월별 리스트로 이동 요청
                      style={{ cursor: "pointer" }}
                    >
                      <span>{tx.date?.slice(2).replace(/-/g, ".")}</span>
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
