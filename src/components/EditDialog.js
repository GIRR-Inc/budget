// src/components/EditDialog.js
import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import "./InputForm.css"; // 기존 스타일 활용

// 유틸: hex 색상을 더 어둡게
function darkenColor(hex, amount = 20) {
  let col = hex.replace("#", "");
  if (col.length === 3)
    col = col
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(col, 16);
  let r = (num >> 16) - amount;
  let g = ((num >> 8) & 0x00ff) - amount;
  let b = (num & 0x0000ff) - amount;
  r = Math.max(0, r);
  g = Math.max(0, g);
  b = Math.max(0, b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

const EditDialog = ({
  open,
  onClose,
  item,
  onSave,
  userId,
  categories,
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
}) => {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [type, setType] = useState("expense"); // expense | income
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [recentCategories, setRecentCategories] = useState([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);

  // 선택된 카테고리 정보
  const selectedCategory = categories.find((cat) => cat.code === category);
  // 최근 사용 카테고리 객체 정보
  const recentCategoryObjs = recentCategories
    .map((code) => categories.find((cat) => cat.code === code))
    .filter(Boolean);

  // 최근 카테고리 갱신 (항목이 바뀔 때마다)
  useEffect(() => {
    if (category) {
      setRecentCategories((prev) => {
        const filtered = prev.filter((c) => c !== category);
        return [category, ...filtered].slice(0, 3);
      });
    }
  }, [category]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCategorySelect = (code) => {
    setCategory(code);
    setShowCategoryDropdown(false);
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c !== code);
      return [code, ...filtered].slice(0, 3);
    });
  };

  const handleCategoryQuickSelect = (code) => {
    setCategory(code);
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c !== code);
      return [code, ...filtered].slice(0, 3);
    });
  };

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

  useEffect(() => {
    document.documentElement.style.setProperty("--main-color", userColor);
    document.documentElement.style.setProperty("--hover-color", hoverColor);
    document.documentElement.style.setProperty(
      "--active-color",
      darkenColor(userColor, 32)
    );
  }, [userColor, hoverColor]);

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
          {/* 커스텀 카테고리 드롭다운만 표시, 최근 카테고리 빠른 선택 제거 */}
          <div className="custom-select-container" ref={categoryDropdownRef}>
            <div
              className={`custom-select ${showCategoryDropdown ? "open" : ""}`}
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
              }}
            >
              <div className="custom-select__selected">
                {selectedCategory ? (
                  <span className="selected-text">
                    {selectedCategory.description}
                  </span>
                ) : (
                  <span className="placeholder">-- 선택하세요 --</span>
                )}
              </div>
              <div className="custom-select__arrow">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path
                    d="M1 1L6 6L11 1"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            {showCategoryDropdown && (
              <div className="custom-select__dropdown">
                <div className="dropdown-options">
                  {categories.map((cat) => (
                    <div
                      key={cat.code}
                      className={`dropdown-option ${
                        category === cat.code ? "selected" : ""
                      }`}
                      onClick={() => handleCategorySelect(cat.code)}
                    >
                      <span className="option-text">{cat.description}</span>
                      {category === cat.code && (
                        <svg
                          className="check-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            background: `linear-gradient(135deg, var(--main-color) 0%, var(--hover-color) 100%)`,
            color: "white",
            fontFamily: "'S-CoreDream-3Light'",
            boxShadow: "none",
            transition: "all 0.2s",
          }}
          onClick={onClose}
        >
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          style={{
            background: `linear-gradient(135deg, var(--main-color) 0%, var(--hover-color) 100%)`,
            color: "white",
            fontFamily: "'S-CoreDream-3Light'",
            transition: "all 0.2s",
          }}
        >
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditDialog;
