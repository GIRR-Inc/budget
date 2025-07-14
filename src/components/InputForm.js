import React, { useState, useRef, useEffect } from "react";
import { addTransaction, fetchMemoSuggestions } from "../api/budgetApi";
import "./InputForm.css";

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
  const amountInputRef = useRef(null);
  const memoInputRef = useRef(null);

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
    } else {
      const filtered = memoSuggestions
        .filter((suggestion) =>
          suggestion.toLowerCase().includes(form.memo.toLowerCase())
        )
        .slice(0, 5);
      setFilteredMemoSuggestions(filtered);
    }
  }, [form.memo, memoSuggestions]);

  const formatWithComma = (value) => {
    const num = value.replace(/,/g, "");
    if (!num) return "";
    return parseInt(num, 10).toLocaleString();
  };

  const unmask = (value) => value.replace(/,/g, "");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "amount") {
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

  return (
    <div>
      <form className="form-container" onSubmit={handleSubmit}>
        <label>
          대분류코드
          {/* 최근 사용 카테고리 빠른 선택 */}
          {recentCategoryObjs.length > 0 && (
            <div style={{ display: "flex", gap: "6px", margin: "6px 0" }}>
              {recentCategoryObjs.map((cat) => (
                <button
                  key={cat.code}
                  type="button"
                  style={{
                    backgroundColor:
                      form.category === cat.code ? userColor : "#f0f0f0",
                    color: form.category === cat.code ? "white" : "#333",
                    border: `1px solid ${
                      form.category === cat.code ? userColor : "#ccc"
                    }`,
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontFamily: "'S-CoreDream-3Light'",
                  }}
                  onClick={() => handleCategoryQuickSelect(cat.code)}
                >
                  {cat.description}
                </button>
              ))}
            </div>
          )}
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">-- 선택하세요 --</option>
            {categories.map((cat) => (
              <option key={cat.code} value={cat.code}>
                {cat.description}
              </option>
            ))}
          </select>
        </label>

        <label>
          금액
          <div className="amount-row">
            <input
              name="amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
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
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "6px",
              marginTop: "8px",
            }}
          >
            {[100, 1000, 10000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                style={{
                  backgroundColor: "#f0f0f0",
                  color: "#333",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px",
                  padding: "3px 8px",
                  minWidth: "unset",
                  cursor: "pointer",
                  fontFamily: "'S-CoreDream-3Light'",
                  lineHeight: 1.1,
                  margin: "2px 0",
                }}
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
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "white",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  zIndex: 1000,
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {filteredMemoSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      fontSize: "14px",
                      fontFamily: "'S-CoreDream-3Light'",
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setForm((prev) => ({ ...prev, memo: suggestion }));
                      setShowMemoSuggestions(false);
                      if (memoInputRef.current) {
                        memoInputRef.current.focus();
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#f5f5f5";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "white";
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
            backgroundColor: userColor,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontFamily: "'S-CoreDream-3Light'",
            padding: "12px 18px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            cursor: "pointer",
            transition: "background-color 0.2s, transform 0.1s",
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = hoverColor;
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = userColor;
          }}
        >
          추가하기
        </button>
      </form>
      {showPopup && (
        <div
          className="popup-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="popup-content"
            style={{
              backgroundColor: "white",
              width: "80%", // ✅ 화면 너비의 90% 사용
              maxWidth: "360px", // ✅ 데스크탑에서는 최대 360px 제한
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              fontFamily: "'S-CoreDream-3Light'",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                marginBottom: "12px",
                fontSize: "clamp(16px, 4vw, 24px)", // ⬅️ 여기!
              }}
            >
              입력 완료!
            </h3>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                marginTop: "10px",
                backgroundColor: userColor,
                color: "white",
                border: "none",
                padding: "10px 20px",
                fontSize: "15px",
                borderRadius: "6px",
                cursor: "pointer",
                width: "100%", // ✅ 모바일에서 버튼이 꽉 차게
                maxWidth: "200px",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = hoverColor)}
              onMouseOut={(e) => (e.target.style.backgroundColor = userColor)}
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
