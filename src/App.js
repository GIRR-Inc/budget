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
} from "./api/budgetApi"; // ✅ fetchUsers 추가
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [sharedGroups, setSharedGroups] = useState([]); // ✅ 추가
  const [activeGroup, setActiveGroup] = useState(null); // ✅ 추가

  const monthlyRef = useRef();

  const handleTransactionClick = (tx) => {
    setActiveTab("monthly");

    setTimeout(() => {
      if (monthlyRef.current) {
        monthlyRef.current.scrollToTransactionById(tx.id, tx.date);
      } else {
        console.warn("monthlyRef is still null");
      }
    }, 150); // 100~200ms 정도가 적당합니다
  };

  // 사용자 목록 불러오기
  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      const bokyung = data.find((u) => u.username === "보경");
      const selectedUser = bokyung ?? data[0];
      setActiveUser(selectedUser);

      // ✅ 사용자 설정 후 그룹도 로드
      const groups = await fetchSharedGroups(selectedUser.id);
      setSharedGroups(groups);
    } catch (error) {
      console.error("사용자 로딩 실패:", error);
    }
  };

  // 이 함수는 한번만 실행하면 됩니다.
  const initSharedGroup = async () => {
    try {
      // 사용자 불러오기 (보경과 다른 사용자)
      const users = await fetchUsers();
      const bokyung = users.find((u) => u.username === "보경");
      const other = users.find((u) => u.username !== "보경");

      if (!bokyung || !other)
        throw new Error("두 명의 사용자 정보가 필요합니다");

      // 그룹 생성
      const group = await createSharedGroup("우리집");

      // 사용자 둘을 멤버로 추가
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
      loadCategories(null, activeGroup.id); // ✅ 그룹 우선
    } else if (activeUser) {
      loadCategories(activeUser.id, null);
    }
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
          ref={monthlyRef} // ✅ ref 연결
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
          onTxClick={handleTransactionClick} // ✅ 전달
        />
      )}{" "}
      {/* ✅ 새 탭 렌더링 */}
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

export default App;
