import React, { useState, useEffect, useRef } from "react";
import BudgetInputPage from "../pages/BudgetInputPage";
import {
  MonthlyList,
  BudgetSummary,
  SettingsDialog,
  TotalSummary,
} from "@/features/budget/components";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import {
  fetchUsers,
  fetchCategories,
  fetchSharedGroups,
  addTransaction,
  fetchFixedCosts,
  fetchBudgetData,
} from "@/api";
import "@/app/App.css";
import s from "./BudgetLayout.module.css"; // <<< 추가

export default function BudgetLayout() {
  const [activeTab, setActiveTab] = useState("input");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  const [fixedCostNotification, setFixedCostNotification] = useState({
    show: false,
    message: "",
    count: 0,
  });

  const [notificationQueue, setNotificationQueue] = useState([]);
  const [isShowingNotification, setIsShowingNotification] = useState(false);
  const [hasAutoInputRun, setHasAutoInputRun] = useState(false);

  const monthlyRef = useRef();

  const showFixedCostNotification = (fixedCosts, categories) => {
    const truncateMemo = (memo) =>
      memo && memo.length > 10 ? memo.slice(0, 10) + "…" : memo;

    const notifications = fixedCosts.map((fixed) => ({
      message: `📌 ${fixed.day}일에 '${
        categories.find((c) => c.code === fixed.category)?.description
      }' 항목${
        fixed.memo ? ` (메모: ${truncateMemo(fixed.memo)})` : ""
      }을 등록했어요. 총 ${Number(
        fixed.amount
      ).toLocaleString()}원이 입력되었어요.`,
      amount: fixed.amount,
      category: fixed.category,
    }));

    setNotificationQueue((prev) => [...prev, ...notifications]);
  };

  useEffect(() => {
    if (notificationQueue.length > 0 && !isShowingNotification) {
      setIsShowingNotification(true);
      const currentNotification = notificationQueue[0];

      setFixedCostNotification({
        show: true,
        message: currentNotification.message,
        count: 1,
      });

      setTimeout(() => {
        setFixedCostNotification((prev) => ({ ...prev, show: false }));
        setTimeout(() => {
          setNotificationQueue((prev) => prev.slice(1));
          setIsShowingNotification(false);
        }, 500);
      }, 2000);
    }
  }, [notificationQueue, isShowingNotification]);

  const handleTransactionClick = (tx) => {
    setActiveTab("monthly");
    setTimeout(() => {
      if (monthlyRef.current) {
        monthlyRef.current.scrollToTransactionById(tx.id, tx.date);
      } else {
        console.warn("monthlyRef is still null");
      }
    }, 150);
  };

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      const bokyung = data.find((u) => u.username === "보경");
      const selectedUser = bokyung ?? data[0];
      setActiveUser(selectedUser);

      const groups = await fetchSharedGroups(selectedUser.id);
      setSharedGroups(groups);
    } catch (error) {
      console.error("사용자 로딩 실패:", error);
    }
  };

  const loadCategories = async (userId = null, groupId = null) => {
    if (!userId && !groupId) return [];
    try {
      const data = await fetchCategories({ userId, groupId });
      setCategories(data);
      return data;
    } catch (error) {
      console.error("카테고리 로딩 실패:", error);
      return [];
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!activeGroup && activeTab === "total") {
      setActiveTab("input");
    }
  }, [activeGroup, activeTab]);

  useEffect(() => {
    const handleUserGroupChange = async () => {
      if (!activeUser && !activeGroup) return;
      try {
        let loadedCategories = [];
        if (activeGroup) {
          loadedCategories = await loadCategories(null, activeGroup.id);
        } else if (activeUser) {
          loadedCategories = await loadCategories(activeUser.id, null);
        }

        const fixedCosts = await fetchFixedCosts(
          activeUser?.id,
          activeGroup?.id
        );
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const todayDay = today.getDate();

        const txs = await fetchBudgetData({
          userId: activeUser?.id,
          groupId: activeGroup?.id,
        });

        let addedFixedCosts = [];

        for (const fixed of fixedCosts) {
          if (!fixed.active) continue;

          const thisMonth = String(month).padStart(2, "0");
          const fixedDateThisMonth = `${year}-${thisMonth}-${String(
            fixed.day
          ).padStart(2, "0")}`;

          let prevYear = year,
            prevMonth = month - 1;
          if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
          }
          const prevMonthStr = String(prevMonth).padStart(2, "0");
          const fixedDatePrevMonth = `${prevYear}-${prevMonthStr}-${String(
            fixed.day
          ).padStart(2, "0")}`;

          const currentMonthTxs = txs.filter((tx) => {
            const d = new Date(tx.date);
            return d.getFullYear() === year && d.getMonth() + 1 === month;
          });

          const prevMonthTxs = txs.filter((tx) => {
            const d = new Date(tx.date);
            return (
              d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth
            );
          });

          const alreadyThisMonth = currentMonthTxs.some(
            (tx) =>
              tx.category === fixed.category &&
              Math.abs(Number(tx.amount)) === Math.abs(Number(fixed.amount)) &&
              tx.memo === fixed.memo &&
              tx.date === fixedDateThisMonth
          );

          const alreadyPrevMonth = prevMonthTxs.some(
            (tx) =>
              tx.category === fixed.category &&
              Math.abs(Number(tx.amount)) === Math.abs(Number(fixed.amount)) &&
              tx.memo === fixed.memo &&
              tx.date === fixedDatePrevMonth
          );

          if (todayDay < fixed.day) {
            if (!alreadyPrevMonth) {
              await addTransaction(
                {
                  category: fixed.category,
                  amount: -fixed.amount,
                  memo: fixed.memo,
                  date: fixedDatePrevMonth,
                },
                activeUser?.id,
                activeGroup?.id
              );
              addedFixedCosts.push(fixed);
            }
          } else {
            if (!alreadyThisMonth) {
              await addTransaction(
                {
                  category: fixed.category,
                  amount: -fixed.amount,
                  memo: fixed.memo,
                  date: fixedDateThisMonth,
                },
                activeUser?.id,
                activeGroup?.id
              );
              addedFixedCosts.push(fixed);
            }
          }
        }

        if (addedFixedCosts.length > 0) {
          showFixedCostNotification(addedFixedCosts, loadedCategories);
        }
      } catch (error) {
        console.error("사용자/그룹 변경 처리 실패:", error);
      }
    };

    handleUserGroupChange();
  }, [activeUser, activeGroup]);

  useEffect(() => {
    setHasAutoInputRun(false);
  }, [activeUser, activeGroup]);

  const mainColor = activeGroup
    ? "#ffd966"
    : activeUser?.username === "보경"
    ? "#f4a8a8"
    : "#91bdf1";

  const hoverColor = activeGroup
    ? "#ffc933"
    : activeUser?.username === "보경"
    ? "#f19191"
    : "#619ee8";

  useEffect(() => {
    document.documentElement.style.setProperty("--main-color", mainColor);
    document.documentElement.style.setProperty("--hover-color", hoverColor);
  }, [mainColor, hoverColor]);

  return (
    <div className={s.container}>
      {/* 고정비용 알림 */}
      {fixedCostNotification.show && (
        <div className={s.notification}>{fixedCostNotification.message}</div>
      )}

      {/* 사용자 탭 */}
      <div className={s.userTabsWrap}>
        <div className={s.pillGroup}>
          {users.map((user) => {
            const active = activeUser?.id === user.id;
            return (
              <button
                key={user.id}
                onClick={() => {
                  setActiveUser(user);
                  setActiveGroup(null);
                }}
                className={`${s.pillBtn} ${active ? s.pillBtnActive : ""}`}
              >
                {user.username}
              </button>
            );
          })}
          {sharedGroups.map((group) => {
            const active = activeGroup?.id === group.id;
            return (
              <button
                key={group.id}
                onClick={() => {
                  setActiveUser(null);
                  setActiveGroup(group);
                }}
                className={`${s.pillBtn} ${active ? s.pillBtnActive : ""}`}
              >
                {group.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 톱니바퀴 버튼 */}
      <div className={s.gearFab}>
        <IconButton
          onClick={() => setSettingsOpen(true)}
          size="large"
          className="settings-icon-button"
          style={{ color: "var(--main-color)", background: "transparent" }}
        >
          <SettingsIcon />
        </IconButton>
      </div>

      <h2 className={s.title}>
        {activeGroup
          ? `우리집 공동 가계부`
          : `${activeUser?.username} 부자 가계부`}
      </h2>

      {/* 탭 버튼 */}
      <div className={s.tabBar}>
        {[
          { label: "입력하기", key: "input" },
          { label: "월별 보기", key: "monthly" },
          { label: "예산 통계", key: "summary" },
          ...(activeGroup ? [{ label: "항목별 누적", key: "total" }] : []),
        ].map(({ label, key }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`${s.tab} ${isActive ? s.tabActive : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "input" && (
        <BudgetInputPage
          categories={categories}
          userId={activeUser?.id ?? null}
          groupId={activeGroup?.id ?? null}
          userColor={mainColor}
          hoverColor={hoverColor}
        />
      )}
      {activeTab === "monthly" && (
        <MonthlyList
          ref={monthlyRef}
          userId={activeUser?.id ?? null}
          groupId={activeGroup?.id ?? null}
          userColor={mainColor}
          hoverColor={hoverColor}
        />
      )}
      {activeTab === "summary" && (
        <BudgetSummary
          userId={activeUser?.id ?? null}
          groupId={activeGroup?.id ?? null}
          userColor={mainColor}
        />
      )}
      {activeTab === "total" && (
        <TotalSummary
          groupId={activeGroup?.id ?? null}
          userColor={mainColor}
          onTxClick={handleTransactionClick}
        />
      )}
      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCategoryChange={() =>
          loadCategories(activeUser?.id ?? null, activeGroup?.id ?? null)
        }
        userId={activeUser?.id ?? null}
        groupId={activeGroup?.id ?? null}
        userColor={mainColor}
        hoverColor={hoverColor}
      />
    </div>
  );
}
