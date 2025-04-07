// src/App.js
import React, { useState } from "react";
import InputForm from "./components/InputForm";
import MonthlyList from "./components/MonthlyList";
import BudgetSummary from "./components/BudgetSummary";
import "./App.css"; // 스타일은 따로 작성

function App() {
  const [activeTab, setActiveTab] = useState("input");

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2 
        style={{ 
          textAlign: "center",
          fontFamily: "'GmarketSansMedium', sans-serif",
        }}>
          우리 보경이의 부자 가계부
          </h2>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1rem" }}>
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
            transition: "all 0.2s ease-in-out"
          }}
          onMouseOver={e => {
            e.target.style.backgroundColor = activeTab === "input" ? "#006ae0" : "#e6f0ff";
          }}
          onMouseOut={e => {
            e.target.style.backgroundColor = activeTab === "input" ? "#f4a8a8" : "white";
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
            gap: "8px"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = activeTab === "monthly" ? "#f19191" : "#faeaea";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = activeTab === "monthly" ? "#f4a8a8" : "white";
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
            gap: "8px"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = activeTab === "summary" ? "#f19191" : "#faeaea";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = activeTab === "summary" ? "#f4a8a8" : "white";
          }}
        >
          월간 예산
        </button>

      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === "input" && <InputForm />}
      {activeTab === "monthly" && <MonthlyList />}
      {activeTab === "summary" && <BudgetSummary />}
    </div>
  );
}

export default App;
