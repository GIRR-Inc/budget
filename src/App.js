import React, { useState, useEffect, useRef } from "react";
import InputForm from "./components/InputForm";
import MonthlyList from "./components/MonthlyList";
import BudgetSummary from "./components/BudgetSummary";
import SettingsDialog from "./components/SettingsDialog";
import TotalSummary from "./components/TotalSummary";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import {
  fetchUsers,
  fetchCategories,
  fetchSharedGroups,
  createSharedGroup,
  addUsersToSharedGroup,
  addTransaction,
} from "./api/budgetApi";
import { fetchFixedCosts, fetchBudgetData } from "./api/budgetApi";
import "./App.css";

// 1. 고정비용 목록 (코드에 직접 작성)
const FIXED_COSTS = [
  {
    category: "월세", // 카테고리 코드 또는 이름
    amount: 500000,
    memo: "집 월세",
    day: 1, // 매월 1일
  },
  {
    category: "넷플릭스",
    amount: 17000,
    memo: "넷플릭스 구독",
    day: 10,
  },
  // ...필요한 만큼 추가
];

function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [sharedGroups, setSharedGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  // 고정비용 자동 입력 알림 상태
  const [fixedCostNotification, setFixedCostNotification] = useState({
    show: false,
    message: "",
    count: 0,
  });

  // 고정비용 알림 큐
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [isShowingNotification, setIsShowingNotification] = useState(false);

  // 고정비용 자동 입력 실행 여부 추적
  const [hasAutoInputRun, setHasAutoInputRun] = useState(false);

  const monthlyRef = useRef();

  // 고정비용 자동 입력 알림 표시 함수
  const showFixedCostNotification = (fixedCosts, categories) => {
    // 알림 큐에 추가
    const notifications = fixedCosts.map((fixed) => ({
      message: `${
        categories.find((c) => c.code === fixed.category)?.description ||
        fixed.category
      } ${fixed.amount.toLocaleString()}원`,
      amount: fixed.amount,
      category: fixed.category,
    }));

    setNotificationQueue((prev) => [...prev, ...notifications]);
  };

  // 알림 큐 처리
  useEffect(() => {
    if (notificationQueue.length > 0 && !isShowingNotification) {
      setIsShowingNotification(true);
      const currentNotification = notificationQueue[0];

      setFixedCostNotification({
        show: true,
        message: currentNotification.message,
        count: 1,
      });

      // 2초 후 알림 숨기기
      setTimeout(() => {
        setFixedCostNotification((prev) => ({ ...prev, show: false }));

        // 0.5초 후 다음 알림 표시
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

  // 사용자 목록 불러오기
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

  // 이 함수는 한번만 실행하면 됩니다.
  const initSharedGroup = async () => {
    try {
      const users = await fetchUsers();
      const bokyung = users.find((u) => u.username === "보경");
      const other = users.find((u) => u.username !== "보경");

      if (!bokyung || !other)
        throw new Error("두 명의 사용자 정보가 필요합니다");

      const group = await createSharedGroup("우리집");
      await addUsersToSharedGroup(group.id, [bokyung.id, other.id]);

      console.log("✅ '우리집' 그룹이 성공적으로 초기화되었습니다.");
    } catch (error) {
      console.error("그룹 초기화 실패:", error.message);
    }
  };

  const loadCategories = async (userId = null, groupId = null) => {
    if (!userId && !groupId) return;

    try {
      const data = await fetchCategories({ userId, groupId });
      setCategories(data);
    } catch (error) {
      console.error("카테고리 로딩 실패:", error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // "항목별 누적" 탭에서 개인 사용자로 전환하면 "입력하기" 탭으로 이동
  useEffect(() => {
    if (!activeGroup && activeTab === "total") {
      setActiveTab("input");
    }
  }, [activeGroup, activeTab]);

  useEffect(() => {
    if (activeGroup) {
      loadCategories(null, activeGroup.id);
    } else if (activeUser) {
      loadCategories(activeUser.id, null);
    }
  }, [activeUser, activeGroup]);

  // 고정비용 자동 입력: 오늘이 고정일 이상이면 이번 달, 오늘이 고정일 전이면 지난달 고정비용 누락 시 자동 입력
  useEffect(() => {
    const autoInputFixedCosts = async () => {
      if (!activeUser && !activeGroup) return;

      try {
        const fixedCosts = await fetchFixedCosts(
          activeUser?.id,
          activeGroup?.id
        );
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const todayDay = today.getDate();

        // 이번 달과 전월 트랜잭션 조회
        const txs = await fetchBudgetData({
          userId: activeUser?.id,
          groupId: activeGroup?.id,
        });
        let addedFixedCosts = []; // 실제로 추가된 고정비용들

        for (const fixed of fixedCosts) {
          if (!fixed.active) continue;

          // 이번 달 고정일자
          const thisMonth = String(month).padStart(2, "0");
          const fixedDateThisMonth = `${year}-${thisMonth}-${String(
            fixed.day
          ).padStart(2, "0")}`;

          // 전월 고정일자 (전월까지만 확인)
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

          // 이번 달과 전월 트랜잭션만 필터링
          const currentMonthTxs = txs.filter((tx) => {
            const txDate = new Date(tx.date);
            const txYear = txDate.getFullYear();
            const txMonth = txDate.getMonth() + 1;
            return txYear === year && txMonth === month;
          });

          const prevMonthTxs = txs.filter((tx) => {
            const txDate = new Date(tx.date);
            const txYear = txDate.getFullYear();
            const txMonth = txDate.getMonth() + 1;
            return txYear === prevYear && txMonth === prevMonth;
          });

          // 이번 달 고정비용 입력 여부
          const alreadyThisMonth = currentMonthTxs.some(
            (tx) =>
              tx.category === fixed.category &&
              Math.abs(Number(tx.amount)) === Math.abs(Number(fixed.amount)) &&
              tx.memo === fixed.memo &&
              tx.date === fixedDateThisMonth
          );

          // 전월 고정비용 입력 여부 (전월까지만 확인)
          const alreadyPrevMonth = prevMonthTxs.some(
            (tx) =>
              tx.category === fixed.category &&
              Math.abs(Number(tx.amount)) === Math.abs(Number(fixed.amount)) &&
              tx.memo === fixed.memo &&
              tx.date === fixedDatePrevMonth
          );

          if (todayDay < fixed.day) {
            // 오늘이 고정일 전이면, 전월 고정비용 누락 시 자동 입력 (전월까지만)
            if (!alreadyPrevMonth) {
              console.log(
                `전월 고정비용 입력: ${fixed.category} ${fixed.amount}원 (${fixedDatePrevMonth})`
              );
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
            // 오늘이 고정일 이상이면, 이번 달 고정비용 누락 시 자동 입력
            if (!alreadyThisMonth) {
              console.log(
                `이번 달 고정비용 입력: ${fixed.category} ${fixed.amount}원 (${fixedDateThisMonth})`
              );
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

        // 자동 입력된 고정비용이 있으면 알림 표시
        if (addedFixedCosts.length > 0) {
          showFixedCostNotification(addedFixedCosts, categories);
        }
      } catch (error) {
        console.error("고정비용 자동 입력 실패:", error);
      }
    };

    autoInputFixedCosts();
  }, [activeUser, activeGroup]); // categories 제거, hasAutoInputRun 플래그 제거

  // 사용자/그룹 변경 시 자동 입력 플래그 리셋
  useEffect(() => {
    setHasAutoInputRun(false);
  }, [activeUser, activeGroup]);

  const mainColor = activeGroup
    ? "#ffd966" // 우리집 색상 (노란색)
    : activeUser?.username === "보경"
    ? "#f4a8a8"
    : "#91bdf1";

  const hoverColor = activeGroup
    ? "#ffc933" // 우리집 hover 색상
    : activeUser?.username === "보경"
    ? "#f19191"
    : "#619ee8";

  // CSS 변수 설정
  useEffect(() => {
    document.documentElement.style.setProperty("--main-color", mainColor);
    document.documentElement.style.setProperty("--hover-color", hoverColor);
  }, [mainColor, hoverColor]);

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "auto",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* 고정비용 자동 입력 알림 */}
      {fixedCostNotification.show && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: `linear-gradient(135deg, ${mainColor} 0%, ${hoverColor} 100%)`,
            color: "white",
            padding: "12px 24px",
            borderRadius: "25px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            fontFamily: "GmarketSansMedium",
            fontSize: "14px",
            fontWeight: 600,
            animation: "notificationSlideDown 0.3s ease-out",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px" }}>💸</span>
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
      <h2
        style={{
          textAlign: "center",
          fontFamily: "'GmarketSansMedium', sans-serif",
        }}
      >
        {activeGroup
          ? `우리집 공동 가계부`
          : `우리 ${activeUser?.username}이의 부자 가계부`}
      </h2>
      {/* 탭 버튼 */}
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
                e.target.style.backgroundColor = isActive
                  ? hoverColor
                  : "#f9f9f9";
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
      {/* 탭 콘텐츠 */}
      {activeTab === "input" && (
        <InputForm
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

      {/* 알림 애니메이션 CSS */}
      <style jsx>{`
        @keyframes notificationSlideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default App;
