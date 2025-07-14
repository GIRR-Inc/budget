// src/components/EditDialog.js
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import "./InputForm.css"; // 기존 스타일 활용

const EditDialog = ({ open, onClose, item, onSave, userId, categories }) => {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [type, setType] = useState("expense"); // expense | income
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (item) {
      const absAmount = Math.abs(item.amount).toString();
      setAmount(absAmount);
      setMemo(item.memo || "");
      setType(item.amount < 0 ? "expense" : "income");
      setCategory(item.category); // 추가
      // 날짜 설정 - item.date가 있으면 사용, 없으면 오늘 날짜
      if (item.date) {
        setDate(item.date);
      } else {
        const today = new Date().toISOString().split("T")[0];
        setDate(today);
      }
    }
  }, [item]);

  const formatWithComma = (value) => {
    const num = value.replace(/,/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString();
  };

  const unmask = (value) => value.replace(/,/g, "");

  const handleSave = () => {
    const numeric = parseInt(unmask(amount), 10) || 0;
    const finalAmount = type === "expense" ? -numeric : numeric;

    onSave({ amount: finalAmount, memo, category, type, userId, date }); // ✅ date 추가
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>항목 수정</DialogTitle>
      <DialogContent>
        <label>
          날짜
          <input
            name="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              fontFamily: "'S-CoreDream-3Light'",
            }}
          />
        </label>
        <label>
          금액
          <div className="amount-row">
            <input
              name="amount"
              type="text"
              inputMode="numeric"
              value={formatWithComma(amount)}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              required
            />
            <div className="type-tabs">
              <button
                type="button"
                className={type === "expense" ? "active" : ""}
                onClick={() => setType("expense")}
              >
                지출
              </button>
              <button
                type="button"
                className={type === "income" ? "active" : ""}
                onClick={() => setType("income")}
              >
                수입
              </button>
            </div>
          </div>
        </label>
        <label>
          카테고리
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "8px",
              marginTop: "4px",
              fontFamily: "'S-CoreDream-3Light'",
            }}
          >
            <option value="" disabled>
              카테고리 선택
            </option>
            {categories.map((c) => (
              <option key={c.code} value={c.code}>
                {c.description}
              </option>
            ))}
          </select>
        </label>
        <label>
          메모
          <input
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </label>
      </DialogContent>

      <DialogActions>
        <Button
          variant="contained"
          style={{
            backgroundColor: "#f0f0f0",
            color: "#444",
            fontFamily: "'S-CoreDream-3Light'",
            boxShadow: "none",
          }}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          style={{
            backgroundColor: "#f19191",
            color: "#fff",
            fontFamily: "'S-CoreDream-3Light'",
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
