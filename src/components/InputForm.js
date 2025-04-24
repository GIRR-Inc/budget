import React, { useState } from "react";
import { addTransaction } from "../api/budgetApi";
import "./InputForm.css";

const InputForm = ({
  categories,
  userId,
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
}) => {
  const getToday = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + now.getTimezoneOffset() + 540); // 540분 = 9시간
    return now.toISOString().split("T")[0];
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
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const rawAmount = parseInt(unmask(form.amount), 10);
    const finalAmount = type === "expense" ? rawAmount * -1 : rawAmount;

    try {
      const result = await addTransaction(
        { ...form, amount: finalAmount },
        userId
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

  return (
    <div>
      <form className="form-container" onSubmit={handleSubmit}>
        <label>
          대분류코드
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
              value={formatWithComma(form.amount)}
              onChange={handleChange}
              required
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
        </label>

        <label>
          세부설명
          <input name="memo" value={form.memo} onChange={handleChange} />
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
            padding: "16px", // ✅ 모바일에서 내용이 너무 붙지 않도록 padding 추가
          }}
          onClick={() => setShowPopup(false)}
        >
          <div
            className="popup-content"
            style={{
              backgroundColor: "white",
              width: "100%", // ✅ 모바일 기준 꽉 차지 않도록 조절
              maxWidth: "360px", // ✅ 데스크탑/태블릿에서는 고정폭
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              fontFamily: "'S-CoreDream-3Light'",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "12px", fontSize: "18px" }}>
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
