import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import MonthlyList from "./components/MonthlyList";
import BudgetSummary from "./components/BudgetSummary";
import SettingsDialog from "./components/SettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import { fetchUsers, fetchCategories } from "./api/budgetApi"; // ✅ fetchUsers 추가
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null); // ✅ id + username

  // 사용자 목록 불러오기
  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
      const bokyung = data.find((u) => u.username === "보경");
      setActiveUser(bokyung ?? data[0]);
    } catch (error) {
      console.error("사용자 로딩 실패:", error);
    }
  };

  const loadCategories = async (userId) => {
    try {
      const data = await fetchCategories(userId);
      setCategories(data);
    } catch (error) {
      console.error("카테고리 로딩 실패:", error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeUser) {
      loadCategories(activeUser.id);
    }
  }, [activeUser]);

  const mainColor = activeUser?.username === "보경" ? "#f4a8a8" : "#91bdf1";
  const hoverColor = activeUser?.username === "보경" ? "#f19191" : "#619ee8";

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
          }}
        >
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => setActiveUser(user)}
              style={{
                padding: "8px 24px",
                border: "none",
                backgroundColor: activeUser?.id === user.id ? mainColor : "white",
                color: activeUser?.id === user.id ? "white" : mainColor,
                fontWeight: 600,
                fontFamily: "'GmarketSansMedium', sans-serif",
                cursor: "pointer",
                outline: "none",
                borderRight: index === 0 ? `1px solid ${mainColor}` : "none",
                transition: "all 0.2s",
              }}
            >
              {user.username}
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
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
        }}
      >
        <IconButton onClick={() => setSettingsOpen(true)} size="large">
          <SettingsIcon style={{ color: mainColor }} />
        </IconButton>
      </div>

      <h2
        style={{
          textAlign: "center",
          fontFamily: "'GmarketSansMedium', sans-serif",
        }}
      >
        우리 {activeUser?.username}이의 부자 가계부
      </h2>

      {/* 탭 버튼 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "1rem",
        }}
      >
        {[
          { label: "입력하기", key: "input" },
          { label: "월별 보기", key: "monthly" },
          { label: "월간 예산", key: "summary" },
        ].map(({ label, key }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              padding: "10px 10px",
              borderRadius: "30px",
              border: `1px solid ${mainColor}`,
              fontFamily: "'GmarketSansMedium', sans-serif",
              fontWeight: 600,
              backgroundColor: activeTab === key ? mainColor : "white",
              color: activeTab === key ? "white" : mainColor,
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor =
                activeTab === key ? hoverColor : "#f0f0f0";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor =
                activeTab === key ? mainColor : "white";
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "input" && <InputForm categories={categories} userId={activeUser?.id} userColor={mainColor} hoverColor={hoverColor} />}
      {activeTab === "monthly" &&   <MonthlyList
                                      userId={activeUser?.id}
                                      userColor={mainColor}  // ✅ 추가
                                    />}
      {activeTab === "summary" && <BudgetSummary userId={activeUser?.id} userColor={mainColor}/>}

      {/* 설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCategoryChange={() => loadCategories(activeUser?.id)}
        userId={activeUser?.id}
      />
    </div>
  );
}

export default App;
