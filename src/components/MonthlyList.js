import React, { useEffect, useState } from "react";
import {
  fetchBudgetData,
  fetchMonthlySummary,
  deleteTransaction,
  updateTransaction,
} from "../api/budgetApi";
import "./MonthlyList.css";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import EditDialog from "./EditDialog";
import { getMatchedIcon } from "../util/iconMap";

const MonthlyList = ({ userId, userColor }) => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [summary, setSummary] = useState({ budget: 0, spent: 0 });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);

  const months = [...new Set(data.map((d) => d.date?.slice(0, 7)))]
    .sort()
    .reverse();
  const filtered = data.filter((d) => d.date?.startsWith(selectedMonth));
  const visibleItems = filtered.slice(0, visibleCount);

  const handleDelete = async (item) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteTransaction(
        item.date,
        item.amount,
        item.category,
        item.memo,
        userId
      );
      const updated = data.filter(
        (d) =>
          !(
            d.date === item.date &&
            d.amount === item.amount &&
            d.category === item.category &&
            d.memo === item.memo
          )
      );
      setData(updated);
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEditSave = async (updated) => {
    try {
      await updateTransaction(editItem, updated, userId);
      const updatedData = data.map((d) =>
        d === editItem
          ? {
              ...editItem,
              amount:
                updated.type === "expense"
                  ? -Math.abs(updated.amount)
                  : Math.abs(updated.amount),
              memo: updated.memo,
            }
          : d
      );
      setData(updatedData);
      setEditDialogOpen(false);
    } catch (err) {
      console.error("수정 실패:", err);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchBudgetData(userId).then((res) => {
      setData(res);
      const months = [...new Set(res.map((d) => d.date?.slice(0, 7)))]
        .sort()
        .reverse();
      if (months.length > 0) setSelectedMonth(months[0]);
    });
  }, [userId]);

  useEffect(() => {
    if (!selectedMonth || !userId) return;
    fetchMonthlySummary(selectedMonth, userId).then((res) => {
      setSummary({ budget: res.budget, spent: res.spent });
    });
  }, [selectedMonth, userId]);

  // 스크롤 시 visibleCount 증가
  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;

      if (nearBottom) {
        setVisibleCount((prev) => Math.min(prev + 15, filtered.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filtered]);

  useEffect(() => {
    setVisibleCount(15); // 월 변경 시 초기화
  }, [selectedMonth]);

  return (
    <div className="monthly-container">
      <div className="tab-bar">
        {months.map((month) => (
          <button
            key={month}
            className={`tab ${month === selectedMonth ? "active" : ""}`}
            onClick={() => setSelectedMonth(month)}
            style={{
              backgroundColor: userColor,
              border: `1px solid ${userColor || "#f4a8a8"}`,
            }}
          >
            {month}
          </button>
        ))}
      </div>

      <div
        className="summary-bar"
        style={{
          backgroundColor: userColor ? `${userColor}15` : "#fff7f7", // 투명도 조정
          border: `1px solid ${userColor || "#f4a8a8"}`,
        }}
      >
        <h3>{selectedMonth} 예산 요약</h3>
        <div className="summary-row">
          <span className="label">예산</span>
          <span className="value">{summary.budget.toLocaleString()}원</span>
        </div>
        <div className="summary-row">
          <span className="label">지출</span>
          <span
            className={`value ${summary.spent > summary.budget ? "over" : ""}`}
          >
            {summary.spent.toLocaleString()}원
          </span>
        </div>
      </div>

      <ul className="list">
        {visibleItems.map((item, idx) => {
          const amount = Number(item.amount);
          const isExpense = amount < 0;
          const formatted = Math.abs(amount).toLocaleString();
          const day = item.date?.slice(8, 10);
          const prevDay = visibleItems[idx - 1]?.date?.slice(8, 10);
          const isNewDay = day !== prevDay;

          return (
            <React.Fragment key={idx}>
              {isNewDay && (
                <div className="date-label">{day}일</div> // 날짜를 그룹 헤더처럼
              )}
               <li className="item" style={isNewDay ? { borderTop: "3px solid #ddd" } : {}}>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item)}
                >
                  <CloseIcon fontSize="small" />
                </button>

                <button
                  className="edit-btn"
                  onClick={() => {
                    setEditItem(item);
                    setEditDialogOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </button>

                <div className="desc">
                  <div className="category">
                    <span>{item.category_name || item.category}</span>
                    {item.is_deleted && (
                      <span className="badge-deleted">삭제된 카테고리</span>
                    )}
                  </div>
                  <span
                    className={`amount ${isExpense ? "expense" : "income"}`}
                  >
                    {isExpense ? "-" : "+"}
                    {formatted}원
                  </span>
                </div>

                {item.memo && (
                  <div className="memo">
                    {getMatchedIcon(item.memo) && (
                      <img
                        src={getMatchedIcon(item.memo)}
                        alt="memo icon"
                        className="memo-icon"
                      />
                    )}
                    {item.memo}
                  </div>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ul>

      <EditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        item={editItem}
        onSave={handleEditSave}
        userId={userId}
      />
    </div>
  );
};

export default MonthlyList;
