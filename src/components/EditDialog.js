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

const EditDialog = ({ open, onClose, item, onSave }) => {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [type, setType] = useState("expense"); // expense | income

  useEffect(() => {
    if (item) {
      const absAmount = Math.abs(item.amount).toString();
      setAmount(absAmount);
      setMemo(item.memo || "");
      setType(item.amount < 0 ? "expense" : "income");
    }
  }, [item]);

  const formatWithComma = (value) => {
    const num = value.replace(/,/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString();
  };

  const unmask = (value) => value.replace(/,/g, "");

  const handleSave = () => {
    const numeric = parseInt(unmask(amount), 10);
    const finalAmount =
      type === "expense" ? -Math.abs(numeric) : Math.abs(numeric);
    onSave({ amount: finalAmount, memo });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>항목 수정</DialogTitle>
      <DialogContent>
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
          style={{ backgroundColor: "#f19191", color: "#fff", fontFamily: "'S-CoreDream-3Light'",}}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
