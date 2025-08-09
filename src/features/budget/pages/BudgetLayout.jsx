// src/BudgetLayout.jsx
import React, { useState, useEffect, useRef } from "react";
import BudgetInputPage from "../pages/BudgetInputPage";
import { MonthlyList, BudgetSummary, SettingsDialog, TotalSummary } from "@/features/budget/components";
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
      }을 등록했어요. 총 ${Number(fixed.amount).toLocaleString()}원이 입력되었어요.`,
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

        const fixedCosts = await fetchFixedCosts(activeUser?.id, activeGroup?.id);
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
            return d.getFullYear() === prevYear && d.getMonth() + 1 === prevMonth;
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
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem", position: "relative" }}>
      {/* 고정비용 알림 */}
      {fixedCostNotification.show && (
        <div
          style={{
            position: "fixed",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#fff",
            color: mainColor,
            padding: "8px 20px",
            borderRadius: "12px",
            border: `1.5px solid ${mainColor}`,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            fontFamily: "'GmarketSansMedium', sans-serif",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.2px",
            animation: "notificationSlideDown 0.3s ease-out",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(1.5px)",
            transition: "all 0.2s ease-in-out",
            maxWidth: "90%",
            wordBreak: "keep-all",
            lineHeight: "1.4",
          }}
        >
          {fixedCostNotification.message}
        </div>
      )}

      {/* 사용자 탭 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            borderRadius: "30px",
            overflow: "hidden",
            border: `2px solid ${mainColor}`,
            boxShadow: `0 4px 15px ${mainColor}30`,
            background: "white",
          }}
        >
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => {
                setActiveUser(user);
                setActiveGroup(null); // 개인 보기
              }}
              style={{
                padding: "10px 28px",
                border: "none",
                background:
                  activeUser?.id === user.id
                    ? `linear-gradient(135deg, ${mainColor} 0%, ${hoverColor} 100%)`
                    : "white",
                color: activeUser?.id === user.id ? "white" : mainColor,
                fontWeight: 600,
                fontFamily: "'GmarketSansMedium', sans-serif",
                cursor: "pointer",
                outline: "none",
                borderRight: index === 0 ? `1px solid ${mainColor}40` : "none",
                transition: "all 0.3s ease",
                fontSize: "14px",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                if (activeUser?.id !== user.id) {
                  e.target.style.background = `linear-gradient(135deg, ${mainColor}20 0%, ${hoverColor}20 100%)`;
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (activeUser?.id !== user.id) {
                  e.target.style.background = "white";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {user.username}
            </button>
          ))}
          {sharedGroups.map((group) => (
            <button
              key={group.id}
              onClick={() => {
                setActiveUser(null);
                setActiveGroup(group);
              }}
              style={{
                padding: "10px 28px",
                border: "none",
                background:
                  activeGroup?.id === group.id
                    ? `linear-gradient(135deg, ${mainColor} 0%, ${hoverColor} 100%)`
                    : "white",
                color: activeGroup?.id === group.id ? "white" : mainColor,
                fontWeight: 600,
                fontFamily: "'GmarketSansMedium', sans-serif",
                cursor: "pointer",
                outline: "none",
                borderLeft: `1px solid ${mainColor}40`,
                transition: "all 0.3s ease",
                fontSize: "14px",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseOver={(e) => {
                if (activeGroup?.id !== group.id) {
                  e.target.style.background = `linear-gradient(135deg, ${mainColor}20 0%, ${hoverColor}20 100%)`;
                  e.target.style.transform = "translateY(-1px)";
                }
              }}
              onMouseOut={(e) => {
                if (activeGroup?.id !== group.id) {
                  e.target.style.background = "white";
                  e.target.style.transform = "translateY(0)";
                }
              }}
            >
              {group.name}
            </button>  
          ))}
        </div>
      </div>
      {/* 톱니바퀴 버튼 */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 1000,
          backgroundColor: "white",
          borderRadius: "50%",
          boxShadow: `0 4px 10px rgba(0, 0, 0, 0.15), 0 2px 8px ${mainColor}20`,
          border: `2px solid ${mainColor}`,
        }}
      >
        <IconButton
          onClick={() => setSettingsOpen(true)}
          size="large"
          className="settings-icon-button"
          style={{
            color: mainColor,
            backgroundColor: "transparent",
            background: "transparent",
          }}
        >
          <SettingsIcon />
        </IconButton>
      </div>

      <h2 style={{ textAlign: "center", fontFamily: "'GmarketSansMedium', sans-serif" }}>
        {activeGroup ? `우리집 공동 가계부` : `우리 ${activeUser?.username}이의 부자 가계부`}
      </h2>

      {/* 탭 버튼 (그대로) */}
      <div className="tab-bar">
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
              className="tab"
              style={{
                backgroundColor: isActive ? mainColor : "white",
                color: isActive ? "white" : mainColor,
                border: `2px solid ${mainColor}`,
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = isActive ? hoverColor : "#f9f9f9";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = isActive ? mainColor : "white";
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 (그대로) */}
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

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCategoryChange={() => loadCategories(activeUser?.id ?? null, activeGroup?.id ?? null)}
        userId={activeUser?.id ?? null}
        groupId={activeGroup?.id ?? null}
        userColor={mainColor}
        hoverColor={hoverColor}
      />

      <style jsx>{`
        @keyframes notificationSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
