// src/App.js
import React, { useState } from "react";
import InputForm from "./components/InputForm";
import MonthlyList from "./components/MonthlyList";
import BudgetSummary from "./components/BudgetSummary";

function App() {
  const [activeTab, setActiveTab] = useState("input");

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "1rem" }}>
      <h2 style={{ textAlign: "center" }}>📒 우리 보경이의 부자 가계부</h2>

      {/* 탭 버튼 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "1rem" }}>
        <button
          onClick={() => setActiveTab("input")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            backgroundColor: activeTab === "input" ? "#007bff" : "#f0f0f0",
            color: activeTab === "input" ? "white" : "black"
          }}
        >
          📥 입력하기
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            backgroundColor: activeTab === "monthly" ? "#007bff" : "#f0f0f0",
            color: activeTab === "monthly" ? "white" : "black"
          }}
        >
          📅 월별 보기
        </button>
        <button
          onClick={() => setActiveTab("summary")}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            backgroundColor: activeTab === "summary" ? "#007bff" : "#f0f0f0",
            color: activeTab === "summary" ? "white" : "black"
          }}
        >
          💰 월간 예산
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
