import React, { useState, useRef, useEffect } from "react";
import { addTransaction, fetchMemoSuggestions } from "../api/budgetApi";
import { fetchFixedCosts } from "../api/budgetApi";
import { Dialog, Button } from "@mui/material";
import "./InputForm.css";

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

const InputForm = ({
  categories,
  userId,
  groupId, // ✅ 추가
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
}) => {
  const getToday = () => {
    const now = new Date();
    const kstOffsetMs = 9 * 60 * 60 * 1000; // KST = UTC+9
    const kstDate = new Date(now.getTime() + kstOffsetMs);
    return kstDate.toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    category: "",
    amount: "",
    memo: "",
    date: getToday(),
  });

  const [fixDate, setFixDate] = useState(false);
  const [type, setType] = useState("expense");
  const [showPopup, setShowPopup] = useState(false);
  const [recentCategories, setRecentCategories] = useState([]); // 최근 사용 카테고리
  const [memoSuggestions, setMemoSuggestions] = useState([]); // 메모 자동완성 제안
  const [showMemoSuggestions, setShowMemoSuggestions] = useState(false); // 메모 제안 표시 여부
  const [filteredMemoSuggestions, setFilteredMemoSuggestions] = useState([]); // 필터링된 메모 제안
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // 카테고리 드롭다운 표시 여부
  const amountInputRef = useRef(null);
  const memoInputRef = useRef(null);
  const categoryDropdownRef = useRef(null);

  // 고정비용 선택 상태
  const [fixedCosts, setFixedCosts] = useState([]);
  const [fixedDialogOpen, setFixedDialogOpen] = useState(false);
  useEffect(() => {
    const loadFixed = async () => {
      try {
        const data = await fetchFixedCosts(userId, groupId);
        setFixedCosts(data);
      } catch (e) {
        setFixedCosts([]);
      }
    };
    if (userId || groupId) loadFixed();
  }, [userId, groupId]);

  // 고정비용 선택 시 입력폼 자동 채움 (카드형)
  const handleFixedCardSelect = (item) => {
    // 당월의 고정비용 일자로 세팅
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(item.day).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    setForm(f => ({
      ...f,
      category: item.category,
      amount: item.amount.toString(),
      memo: item.memo || "",
      date: dateStr,
    }));
    setFixedDialogOpen(false);
  };

  // 컴포넌트 마운트 시 메모 제안 가져오기
  useEffect(() => {
    const loadMemoSuggestions = async () => {
      try {
        const suggestions = await fetchMemoSuggestions(userId, groupId);
        setMemoSuggestions(suggestions);
      } catch (error) {
        console.error("메모 제안 로드 실패:", error);
      }
    };

    loadMemoSuggestions();
  }, [userId, groupId]);

  // 메모 입력 시 필터링 (2글자 이상일 때만)
  useEffect(() => {
    if (form.memo.trim().length < 2) {
      setFilteredMemoSuggestions([]); // 2글자 미만이면 제안 표시 안함
      setShowMemoSuggestions(false); // 2글자 미만이면 드롭다운 숨김
    } else {
      const filtered = memoSuggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(form.memo.toLowerCase())
        )
        .slice(0, 5);
      setFilteredMemoSuggestions(filtered);
      // 필터링된 결과가 있으면 드롭다운 표시
      if (filtered.length > 0) {
        setShowMemoSuggestions(true);
      }
    }
  }, [form.memo, memoSuggestions]);

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

  const formatWithComma = (value) => {
    const num = value.replace(/,/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString();
  };

  const unmask = (value) => value.replace(/,/g, "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
      // 입력값에서 콤마와 숫자가 아닌 문자를 모두 제거
      const raw = value.replace(/,/g, "").replace(/\D/g, "");
      setForm({ ...form, [name]: raw });
    } else if (name === "category") {
      setForm({ ...form, [name]: value });
      // 최근 카테고리 갱신
      if (value) {
        setRecentCategories((prev) => {
          const filtered = prev.filter((c) => c !== value);
          return [value, ...filtered].slice(0, 3);
        });
      }
    } else if (name === "memo") {
      setForm({ ...form, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleCategorySelect = (code) => {
    setForm((prev) => ({ ...prev, category: code }));
    setShowCategoryDropdown(false);
    // 최근 카테고리 갱신
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c !== code);
      return [code, ...filtered].slice(0, 3);
    });
  };

  const handleCategoryQuickSelect = (code) => {
    setForm((prev) => ({ ...prev, category: code }));
    setRecentCategories((prev) => {
      const filtered = prev.filter((c) => c !== code);
      return [code, ...filtered].slice(0, 3);
    });
  };

  const handleAmountPreset = (amount) => {
    setForm((prev) => {
      const prevAmount = Number(prev.amount.replace(/,/g, "")) || 0;
      const newAmount = prevAmount + amount;
      return { ...prev, amount: newAmount.toString() };
    });
    if (amountInputRef.current) {
      amountInputRef.current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = parseInt(unmask(form.amount), 10);
    const finalAmount = type === "expense" ? rawAmount * -1 : rawAmount;

    try {
      const result = await addTransaction(
        { ...form, amount: finalAmount },
        userId,
        groupId
      ); // ✅ userId 전달
      if (result.status === "success") {
        setShowPopup(true);
        setForm({
          category: "",
          amount: "",
          memo: "",
          date: fixDate ? form.date : getToday(), // ✅ 날짜 유지 여부 결정
        });
        setType("expense");
      } else {
        alert("실패: " + (result.message || "알 수 없는 오류"));
      }
    } catch (err) {
      console.error("에러 발생:", err);
      alert("오류가 발생했습니다. 콘솔을 확인해주세요.");
    }
  };

  // 최근 사용 카테고리 객체 정보
  const recentCategoryObjs = recentCategories
    .map((code) => categories.find((cat) => cat.code === code))
    .filter(Boolean);

  // 선택된 카테고리 정보
  const selectedCategory = categories.find((cat) => cat.code === form.category);

  // CSS 변수 설정
  useEffect(() => {
    document.documentElement.style.setProperty("--main-color", userColor);
    document.documentElement.style.setProperty("--hover-color", hoverColor);
    document.documentElement.style.setProperty(
      "--active-color",
      darkenColor(userColor, 32)
    );
  }, [userColor, hoverColor]);

  return (
    <div>
      {/* 고정비용 빠른입력 버튼+팝오버 카드형 */}
      {fixedCosts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Button
            variant="contained"
            style={{
              background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
              color: "white",
              fontWeight: 600,
              borderRadius: 10,
              boxShadow: "0 2px 8px rgba(244,168,168,0.15)",
              fontFamily: "'S-CoreDream-3Light'",
              fontSize: 15,
              padding: "10px 24px",
            }}
            onClick={() => setFixedDialogOpen(true)}
          >
            💸 고정비용 빠른입력
          </Button>
          <Dialog open={fixedDialogOpen} onClose={() => setFixedDialogOpen(false)} maxWidth="xs" fullWidth>
            <div style={{ padding: 24, background: "#fff8f8" }}>
              <h3 style={{ fontFamily: 'GmarketSansMedium', fontSize: 20, marginBottom: 18, color: userColor }}>고정비용 선택</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fixedCosts.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleFixedCardSelect(item)}
                    style={{
                      borderRadius: 14,
                      boxShadow: `0 2px 12px ${userColor}22`,
                      background: `linear-gradient(135deg, #fff 60%, ${userColor}11 100%)`,
                      padding: '18px 18px 14px 18px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      border: `2px solid ${userColor}33`,
                      transition: 'box-shadow 0.2s, border 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.boxShadow = `0 4px 18px ${hoverColor}55`}
                    onMouseOut={e => e.currentTarget.style.boxShadow = `0 2px 12px ${userColor}22`}
                  >
                    <span style={{ fontSize: 28, marginRight: 6 }}>💸</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: userColor, marginBottom: 2 }}>
                        {categories.find(c => c.code === item.category)?.description || item.category}
                      </div>
                      <div style={{ fontSize: 15, color: '#2c3e50', fontWeight: 600 }}>
                        {item.amount.toLocaleString()}원
                        {item.memo && <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>({item.memo})</span>}
                      </div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>매월 {item.day}일</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setFixedDialogOpen(false)}
                style={{ marginTop: 24, width: '100%', background: userColor, color: 'white', borderRadius: 8 }}
                variant="contained"
              >
                닫기
              </Button>
            </div>
          </Dialog>
        </div>
      )}
      <form className="form-container" onSubmit={handleSubmit}>
        <label>
          대분류코드
          {/* 커스텀 카테고리 드롭다운 */}
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
                        form.category === cat.code ? "selected" : ""
                      }`}
                      onClick={() => handleCategorySelect(cat.code)}
                    >
                      <span className="option-text">{cat.description}</span>
                      {form.category === cat.code && (
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
          금액
          <div className="amount-row">
            <input
              name="amount"
              type="text"
              inputMode="numeric"
              autoFocus
              ref={amountInputRef}
              value={formatWithComma(form.amount)}
              onChange={handleChange}
              required
              autoComplete="off"
            />
            <div className="type-tabs">
              {["expense", "income"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  style={{
                    padding: "10px 14px",
                    fontSize: "14px",
                    border: "1px solid",
                    borderRadius: "6px",
                    backgroundColor: type === t ? userColor : "#f0f0f0",
                    color: type === t ? "white" : "#333",
                    borderColor: type === t ? userColor : "#ccc",
                    minWidth: "52px",
                    cursor: "pointer",
                    fontFamily: "'S-CoreDream-3Light'",
                    transition: "0.2s",
                  }}
                >
                  {t === "expense" ? "지출" : "수입"}
                </button>
              ))}
            </div>
          </div>
          {/* 금액 프리셋 버튼 */}
          <div className="amount-preset-buttons">
            {[100, 1000, 10000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                className="amount-preset-btn"
                onClick={() => handleAmountPreset(preset)}
              >
                +
                {preset === 100
                  ? "1백"
                  : preset === 1000
                  ? "1천"
                  : preset === 10000
                  ? "1만"
                  : "10만"}
                원
              </button>
            ))}
          </div>
        </label>

        <label>
          세부설명
          <div style={{ position: "relative" }}>
            <input
              name="memo"
              value={form.memo}
              onChange={handleChange}
              ref={memoInputRef}
              onFocus={() => setShowMemoSuggestions(true)}
              onBlur={() => {
                // 약간의 지연을 두어 클릭 이벤트가 처리되도록 함
                setTimeout(() => setShowMemoSuggestions(false), 150);
              }}
              autoComplete="off"
            />
            {showMemoSuggestions && filteredMemoSuggestions.length > 0 && (
              <div className="memo-suggestions">
                {filteredMemoSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="memo-suggestion-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm((prev) => ({ ...prev, memo: suggestion }));
                      setShowMemoSuggestions(false);
                      if (memoInputRef.current) {
                        memoInputRef.current.focus();
                      }
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </label>
        <div style={{ marginBottom: "8px" }}>
          {/* 일자 + 날짜 고정 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span className="label-span">일자</span>
            <span
              className="label-span"
              style={{
                flexDirection: "row",
                alignItems: "center", // ✅ 중요!
                gap: "4px",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={fixDate}
                onChange={(e) => setFixDate(e.target.checked)}
                style={{ verticalAlign: "middle" }} // ✅ 체크박스 정렬 보정
              />
              <span className="label-small" style={{ lineHeight: "1" }}>
                날짜 고정
              </span>
            </span>
          </div>

          {/* 날짜 입력 필드 */}
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            style={{ width: "100%", marginTop: "6px" }}
          />
        </div>

        <button
          type="submit"
          style={{
            background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
          }}
        >
          추가하기
        </button>
      </form>
      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>입력 완료!</h3>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputForm;
