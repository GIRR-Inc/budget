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

// ✅ userId props로 받기
const MonthlyList = ({ userId }) => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [summary, setSummary] = useState({ budget: 0, spent: 0 });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const handleDelete = async (item) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteTransaction(item.date, item.amount, item.category, item.memo, userId); // ✅ userId 추가
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
      await updateTransaction(editItem, updated, userId); // ✅ userId 추가
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
      const months = [...new Set(res.map((d) => d.date?.slice(0, 7)))].sort().reverse();
      if (months.length > 0) setSelectedMonth(months[0]);
    });
  }, [userId]);

  useEffect(() => {
    if (!selectedMonth || !userId) return;

    fetchMonthlySummary(selectedMonth, userId).then((res) => {
      setSummary({ budget: res.budget, spent: res.spent });
    });
  }, [selectedMonth, userId]);

  const months = [...new Set(data.map((d) => d.date?.slice(0, 7)))].sort().reverse();
  const filtered = data.filter((d) => d.date?.startsWith(selectedMonth));

  return (
    <div className="monthly-container">
      <div className="tab-bar">
        {months.map((month) => (
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
              <button className="delete-btn" onClick={() => handleDelete(item)}>
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

              <div className="date">{item.date?.slice(8, 10)}일</div>

              <div className="desc">
                <div className="category">
                  <span>{item.category_name || item.category}</span>
                  {item.is_deleted && (
                    <span className="badge-deleted">삭제된 카테고리</span>
                  )}
                </div>
                <span className={`amount ${isExpense ? "expense" : "income"}`}>
                  {isExpense ? "-" : "+"}
                  {formatted}원
                </span>
              </div>

              {item.memo && <div className="memo">({item.memo})</div>}
            </li>
          );
        })}
      </ul>

      {/* ✏️ 수정 다이얼로그 */}
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
