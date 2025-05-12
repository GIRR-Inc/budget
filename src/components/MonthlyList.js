import React, { useEffect, useState } from "react";
import {
  fetchBudgetData,
  fetchMonthlySummary,
  deleteTransaction,
  updateTransaction,
  fetchCategorySummary,
  fetchCategories,
} from "../api/budgetApi";
import "./MonthlyList.css";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditDialog from "./EditDialog";
import { getMatchedIcon } from "../util/iconMap";

const MonthlyList = ({ userId, groupId, userColor }) => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [summary, setSummary] = useState({ budget: 0, spent: 0 });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [categories, setCategories] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // ✅ 추가

  const months = [...new Set(data.map((d) => d.date?.slice(0, 7)))].sort().reverse();

  const filtered = data
    .filter((d) => d.date?.startsWith(selectedMonth))
    .filter((d) => (selectedCategory ? d.category === selectedCategory : true)); // ✅ 카테고리 필터

  const visibleItems = filtered.slice(0, visibleCount);

  const handleDelete = async (item) => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await deleteTransaction(item.id);
      const updated = data.filter((d) => d.id !== item.id);
      setData(updated);
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEditSave = async (updated) => {
    try {
      await updateTransaction(editItem, updated, userId, groupId); // ✅ 수정된 호출부
      const updatedData = data.map((d) =>
        d === editItem
          ? {
              ...editItem,
              amount: updated.type === "expense" ? -Math.abs(updated.amount) : Math.abs(updated.amount),
              memo: updated.memo,
              category: updated.category,
              category_name: categories.find((c) => c.code === updated.category)?.description || "카테고리 수정",
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
    if (!userId && !groupId) return;

    fetchBudgetData({ userId, groupId }).then((res) => {
      setData(res);
      const months = [...new Set(res.map((d) => d.date?.slice(0, 7)))].sort().reverse();
      if (months.length > 0) setSelectedMonth(months[0]);
    });

    fetchCategories({ userId, groupId }).then((res) => {
      setCategories(res);
    });

    setSelectedCategory(null);
  }, [userId, groupId]);

  useEffect(() => {
    if (!selectedMonth || (!userId && !groupId)) return;

    fetchMonthlySummary(selectedMonth, userId, groupId).then((res) => {
      setSummary({ budget: res.budget, spent: res.spent });
    });

    fetchCategorySummary(selectedMonth, userId, groupId).then((res) => {
      setCategorySummary(res);
    });
  }, [selectedMonth, userId, groupId]);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      if (nearBottom) {
        setVisibleCount((prev) => Math.min(prev + 15, filtered.length));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filtered]);

  useEffect(() => {
    setVisibleCount(15);
  }, [selectedMonth, selectedCategory]); // ✅ 카테고리 바뀔 때도 초기화

  return (
    <div className="monthly-container">
<div className="tab-bar">
  {months.map((month) => (
    <button
      key={month}
      className={`tab ${month === selectedMonth ? "active" : ""}`}
      onClick={() => {
        setSelectedMonth(month);
        setSelectedCategory(null); // ✅ 월 변경 시 카테고리 초기화
      }}
      style={{
        backgroundColor: month === selectedMonth ? userColor : "transparent",
        color: month === selectedMonth ? "white" : "black", // 선택된 경우 글자색도 조정 (선택 사항)
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
          backgroundColor: userColor ? `${userColor}15` : "#fff7f7",
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
          <span className={`value ${summary.spent > summary.budget ? "over" : ""}`}>
            {summary.spent.toLocaleString()}원
          </span>
        </div>

        <div className="toggle-button-wrapper">
          <button onClick={() => setShowDetail((prev) => !prev)}>
            {showDetail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </button>
        </div>

        {showDetail && (
          <div className="category-summary">
            {categorySummary.length === 0 ? (
              <p className="empty">지출 내역이 없습니다.</p>
            ) : (
              <ul className="category-list">
                {categorySummary
                  .slice() // 원본 배열을 복사 (state 불변성 유지)
                  .sort((a, b) => b.total - a.total) // 🔥 총합(total)이 높은 순으로 정렬
                  .map((cat, idx) => {
                    const percent = summary.spent > 0 ? Math.round((cat.total / summary.spent) * 100) : 0;
                    const isSelected = selectedCategory === cat.category;

                    return (
                      <li
                        key={idx}
                        className={`category-item ${isSelected ? "clicked" : ""}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCategory(null);
                          } else {
                            setSelectedCategory(cat.category);
                          }
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        style={{
                          cursor: "pointer",
                          backgroundColor: isSelected ? (userColor || "#d1e7ff") : "transparent",
                        }}
                      >
                        <span className="category-name">{cat.name}</span>
                        <span className="category-amount">
                          {cat.total.toLocaleString()}원{" "}
                          <span className="category-percent">({percent}%)</span>
                        </span>
                      </li>
                    );
                  })}

              </ul>
            )}
          </div>
        )}
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
              {isNewDay && <div className="date-label">{day}일</div>}
              <li
                className="item"
                style={isNewDay ? { borderTop: "3px solid #ddd" } : {}}
              >
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

                <div className="desc">
                  <div className="left-block">
                    <div className="category">
                      <span className="category-badge">
                        {item.category_name || item.category}
                      </span>
                      {item.is_deleted && (
                        <span className="badge-deleted">삭제된 카테고리</span>
                      )}
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
                  </div>

                  <span className={`amount ${isExpense ? "expense" : "income"}`}>
                    {isExpense ? "-" : "+"}
                    {formatted}원
                  </span>
                </div>
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
        categories={categories}
      />
    </div>
  );
};

export default MonthlyList;
