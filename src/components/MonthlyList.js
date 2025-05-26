import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  fetchBudgetData,
  fetchMonthlySummary,
  deleteTransaction,
  updateTransaction,
  fetchCategorySummary,
  fetchCategories,
  fetchGroupMembers,
  fetchPersonalExpensesForGroupMembers,
} from "../api/budgetApi";
import "./MonthlyList.css";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import EditDialog from "./EditDialog";
import { getMatchedIcon } from "../util/iconMap";

const MonthlyList = forwardRef(({ userId, groupId, userColor }, ref) => {
  const [data, setData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [summary, setSummary] = useState({ budget: 0, spent: 0 });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [categories, setCategories] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [individualExpenses, setIndividualExpenses] = useState({});
  const [groupMembers, setGroupMembers] = useState([]);
  const [includedUsers, setIncludedUsers] = useState({});

  const months = [...new Set(data.map((d) => d.date?.slice(0, 7)))]
    .sort()
    .reverse();

  const filtered = data
    .filter((d) => d.date?.startsWith(selectedMonth))
    .filter((d) => (selectedCategory ? d.category === selectedCategory : true));

  // 월 전체 기준 수입 데이터 (카테고리 무관)
  const allThisMonth = data.filter((item) =>
    item.date?.startsWith(selectedMonth)
  );
  const totalIncomeThisMonth = allThisMonth
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount), 0);

  // ✅ 선택된 개인지출 합계 계산
  const includedPersonalExpense = groupMembers.reduce((sum, user) => {
    return includedUsers[user.id]
      ? sum + (individualExpenses[user.id] || 0)
      : sum;
  }, 0);

  // ✅ 최종 지출 및 순이익 계산
  const adjustedSpent = summary.spent + includedPersonalExpense;
  const netIncome = totalIncomeThisMonth - adjustedSpent;

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
      await updateTransaction(editItem, updated, userId, groupId);
      const updatedData = data.map((d) =>
        d === editItem
          ? {
              ...editItem,
              amount:
                updated.type === "expense"
                  ? -Math.abs(updated.amount)
                  : Math.abs(updated.amount),
              memo: updated.memo,
              category: updated.category,
              category_name:
                categories.find((c) => c.code === updated.category)
                  ?.description || "카테고리 수정",
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
    const loadGroupDetails = async () => {
      if (!groupId || !selectedMonth) return;

      try {
        const members = await fetchGroupMembers(groupId);
        const memberIds = members.map((m) => m.id);

        const expenses = await fetchPersonalExpensesForGroupMembers(
          selectedMonth,
          memberIds
        );

        setGroupMembers(members);
        setIndividualExpenses(expenses);

        // ✅ 여기에서 초기 체크 상태를 true로 초기화
        const initialChecked = {};
        members.forEach((m) => {
          initialChecked[m.id] = true;
        });
        setIncludedUsers(initialChecked);
      } catch (err) {
        console.error("❌ 개인 지출 정보 로딩 실패:", err);
      }
    };

    loadGroupDetails();
  }, [groupId, selectedMonth]);

  useEffect(() => {
    if (!userId && !groupId) return;

    fetchBudgetData({ userId, groupId }).then((res) => {
      setData(res);
      const months = [...new Set(res.map((d) => d.date?.slice(0, 7)))]
        .sort()
        .reverse();
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
    setVisibleCount(15);
  }, [selectedMonth, selectedCategory]);

  const scrollToTx = (id) => {
    const el = document.getElementById(`tx-${id}`);

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 1500);
    } else {
      console.warn("❌ 스크롤 대상 요소가 아직 DOM에 없음:", id);
    }
  };

  useImperativeHandle(ref, () => ({
    scrollToTransactionById: (id, dateStr) => {
      const txMonth = dateStr?.slice(0, 7);
      if (txMonth !== selectedMonth) {
        setSelectedMonth(txMonth);
        setTimeout(() => scrollToTx(id), 300); // 월 변경 후 스크롤
      } else {
        scrollToTx(id);
      }
    },
  }));

  return (
    <div className="monthly-container">
      <div className="tab-bar">
        {months.map((month) => (
          <button
            key={month}
            className={`tab ${month === selectedMonth ? "active" : ""}`}
            onClick={() => {
              setSelectedMonth(month);
              setSelectedCategory(null);
            }}
            style={{
              backgroundColor:
                month === selectedMonth ? userColor : "transparent",
              color: month === selectedMonth ? "white" : "black",
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

        <div className="summary-section">
          <div className="summary-item budget">
            <span className="label">예산</span>
            <span className="amount">{summary.budget.toLocaleString()}원</span>
          </div>

          {groupId && (
            <div className="summary-item income">
              <span className="label">수입</span>
              <span className="amount">
                +
                {data
                  .filter((item) => item.date?.startsWith(selectedMonth))
                  .filter((item) => Number(item.amount) > 0)
                  .reduce((sum, item) => sum + Number(item.amount), 0)
                  .toLocaleString()}
                원
              </span>
            </div>
          )}

          <div className="summary-item expense">
            <span className="label">지출</span>
            <span className="amount">-{adjustedSpent.toLocaleString()}원</span>
          </div>
          <div className="sub-expense-inline-checkbox">
            <span className="prefix">(</span>
            {groupMembers.map((user, idx) => {
              const amt = individualExpenses[user.id] || 0;
              const checked = includedUsers[user.id] ?? true;
              const amountText = amt.toLocaleString() + "원";

              return (
                <div key={user.id} className="expense-checkbox-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setIncludedUsers((prev) => ({
                        ...prev,
                        [user.id]: e.target.checked,
                      }))
                    }
                  />
                  <span className="expense-text">
                    {user.username} {amountText}
                  </span>
                  {idx !== groupMembers.length - 1 && (
                    <span className="divider">/</span>
                  )}
                </div>
              );
            })}
            <span className="suffix">)</span>
          </div>

          {groupId && (
            <div className="summary-item net">
              <span className="label">순이익</span>
              <span className="amount">
                {netIncome >= 0 ? "+" : "-"}
                {Math.abs(netIncome).toLocaleString()}원
              </span>
            </div>
          )}
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
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((cat, idx) => {
                    const percent =
                      summary.spent > 0
                        ? Math.round((cat.total / summary.spent) * 100)
                        : 0;
                    const isSelected = selectedCategory === cat.category;

                    return (
                      <li
                        key={idx}
                        className={`category-item ${
                          isSelected ? "clicked" : ""
                        }`}
                        onClick={() => {
                          setSelectedCategory(isSelected ? null : cat.category);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        style={{
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? userColor || "#d1e7ff"
                            : "transparent",
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
              {isNewDay && (
                <div className="date-label-wrapper">
                  <div className="date-label">{day}일</div>
                  <div className="day-total">
                    {filtered
                      .filter((d) => d.date?.slice(8, 10) === day)
                      .reduce((sum, d) => sum + Number(d.amount), 0)
                      .toLocaleString()}
                    원
                  </div>
                </div>
              )}
              <li
                id={`tx-${item.id}`}
                className="item"
                style={isNewDay ? { borderTop: "3px solid #ddd" } : {}}
              >
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
                  <span
                    className={`amount ${isExpense ? "expense" : "income"}`}
                  >
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
});

export default MonthlyList;
