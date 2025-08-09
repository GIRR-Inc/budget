// src/features/budget/components/FixedCostForm.jsx
import React, { useState } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  InputAdornment,
  Paper,
} from "@mui/material";
import styles from "./FixedCostForm.module.css";

const fmt = (v) => (v ? Number(v).toLocaleString() : "");
const unfmt = (v) => String(v || "").replace(/[^\d]/g, "");

export default function FixedCostForm({
  categories = [],
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
  onSubmit,
}) {
  const [form, setForm] = useState({
    category: "",
    amount: "",
    day: 30, // 반복 주기(일)
    memo: "",
    active: true,
  });

  const canSubmit =
    form.category &&
    Number(unfmt(form.amount)) > 0 &&
    Number(form.day) >= 1 &&
    Number(form.day) <= 365;

  const handleChange = (key) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [key]: key === "amount" ? unfmt(val) : val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    await onSubmit?.({
      category: form.category,
      amount: Number(unfmt(form.amount)),
      day: Number(form.day), // ✅ DB에는 반복 주기(일)만 전달
      memo: form.memo?.trim() || "",
      active: !!form.active,
    });

    setForm({ category: "", amount: "", day: 30, memo: "", active: true });
  };

  return (
    <Paper className={styles.card} elevation={0}>
      <form onSubmit={handleSubmit}>
        {/* 카테고리 */}
        <div className={styles.field}>
          <FormControl fullWidth size="small">
            <InputLabel>카테고리</InputLabel>
            <Select
              label="카테고리"
              value={form.category}
              onChange={handleChange("category")}
            >
              <MenuItem value="">
                <em>선택</em>
              </MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  {c.description}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        {/* 금액 */}
        <div className={styles.field}>
          <TextField
            fullWidth
            size="small"
            label="금액"
            value={fmt(form.amount)}
            onChange={handleChange("amount")}
            inputMode="numeric"
            placeholder="예) 50,000"
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>,
            }}
          />
        </div>

        {/* 반복 주기(일) */}
        <div className={styles.field}>
          <TextField
            fullWidth
            size="small"
            type="number"
            label="반복 주기(일)"
            value={form.day}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                day: Math.max(1, Math.min(365, Number(e.target.value) || 1)),
              }))
            }
            InputProps={{
              inputProps: { min: 1, max: 365 },
              endAdornment: <span style={{ marginLeft: 6 }}>일</span>,
            }}
            placeholder="예) 30"
          />
        </div>

        {/* 메모 */}
        <div className={styles.field}>
          <TextField
            fullWidth
            size="small"
            label="메모 (선택)"
            value={form.memo}
            onChange={handleChange("memo")}
            placeholder="예) 넷플릭스, 통신비 등"
          />
        </div>

        {/* 제출 */}
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={!canSubmit}
          sx={{
            py: 1.2,
            fontWeight: 700,
            background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
          }}
        >
          고정비용 추가
        </Button>
      </form>
    </Paper>
  );
}
