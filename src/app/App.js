// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import BudgetLayout from "../features/budget/pages/BudgetLayout";
import {SignInPage} from "../features/auth/pages/SignInPage";
import {SignUpPage} from "../features/auth/pages/SignUpPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/signin" element={<SignInPage />} />
        <Route path="/auth/signup" element={<SignUpPage />} />
        {/* 가계부 메인 */}
        <Route path="/budget" element={<BudgetLayout />} />
        {/* 기본 루트 리다이렉트 */}
        <Route path="*" element={<Navigate to="/budget" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
