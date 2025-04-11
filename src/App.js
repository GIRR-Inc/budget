// src/App.js
import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import MonthlyList from "./components/MonthlyList";
import BudgetSummary from "./components/BudgetSummary";
import SettingsDialog from "./components/SettingsDialog"; // 새로 만들 컴포넌트
import SettingsIcon from "@mui/icons-material/Settings";
import IconButton from "@mui/material/IconButton";
import { fetchCategories } from "./api/budgetApi"; // API 추가
import "./App.css"; // 스타일은 따로 작성

function App() {
  const [activeTab, setActiveTab] = useState("input");
  const [settingsOpen, setSettingsOpen] = useState(false); // 다이얼로그 상태
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (error) {
      console.error("카테고리 로딩 실패:", error);
    }
  };
  
  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "auto",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* 오른쪽 상단 톱니바퀴 */}
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
          <SettingsIcon style={{ color: "#f19191" }} />
        </IconButton>
      </div>

      <h2
        style={{
          textAlign: "center",
          fontFamily: "'GmarketSansMedium', sans-serif",
        }}
      >
        우리 보경이의 부자 가계부
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
        <button
          onClick={() => setActiveTab("input")}
          style={{
            padding: "10px 10px",
            borderRadius: "30px",
            border: "1px solid #f4a8a8",
            fontFamily: "'GmarketSansMedium', sans-serif",
            fontWeight: 600,
            backgroundColor: activeTab === "input" ? "#f4a8a8" : "white",
            color: activeTab === "input" ? "white" : "#f4a8a8",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor =
              activeTab === "input" ? "#006ae0" : "#e6f0ff";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor =
              activeTab === "input" ? "#f4a8a8" : "white";
          }}
        >
          입력하기
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          style={{
            padding: "10px 10px",
            borderRadius: "30px",
            border: "1px solid #f4a8a8",
            fontFamily: "'GmarketSansMedium', sans-serif",
            fontWeight: 600,
            backgroundColor: activeTab === "monthly" ? "#f4a8a8" : "white",
            color: activeTab === "monthly" ? "white" : "#f4a8a8",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor =
              activeTab === "monthly" ? "#f19191" : "#faeaea";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor =
              activeTab === "monthly" ? "#f4a8a8" : "white";
          }}
        >
          월별 보기
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          style={{
            padding: "10px 10px",
            borderRadius: "30px",
            border: "1px solid #f4a8a8",
            fontFamily: "'GmarketSansMedium', sans-serif",
            fontWeight: 600,
            backgroundColor: activeTab === "summary" ? "#f4a8a8" : "white",
            color: activeTab === "summary" ? "white" : "#f4a8a8",
            boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor =
              activeTab === "summary" ? "#f19191" : "#faeaea";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor =
              activeTab === "summary" ? "#f4a8a8" : "white";
          }}
        >
          월간 예산
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "input" && <InputForm categories={categories} />}
      {activeTab === "monthly" && <MonthlyList />}
      {activeTab === "summary" && <BudgetSummary />}

      {/* 환경설정 다이얼로그 */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onCategoryChange={loadCategories} // 추가
      />
    </div>
  );
}

export default App;
