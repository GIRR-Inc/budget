import React, { useState } from "react";
import { addTransaction } from "../api/budgetApi";
import "./InputForm.css";

const InputForm = ({ categories, userId }) => {
  const getToday = () => new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    category: "",
    amount: "",
    memo: "",
    date: getToday(),
  });

  const [type, setType] = useState("expense");

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
      const result = await addTransaction({ ...form, amount: finalAmount }, userId); // ✅ userId 전달
      if (result.status === "success") {
        alert("입력 완료!");
        setForm({ category: "", amount: "", memo: "", date: getToday() });
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
    <form className="form-container" onSubmit={handleSubmit}>
      <label>
        대분류코드
        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">-- 선택하세요 --</option>
          {categories.map(cat => (
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
            <button type="button" className={type === "expense" ? "active" : ""} onClick={() => setType("expense")}>
              지출
            </button>
            <button type="button" className={type === "income" ? "active" : ""} onClick={() => setType("income")}>
              수입
            </button>
          </div>
        </div>
      </label>

      <label>
        세부설명
        <input name="memo" value={form.memo} onChange={handleChange} />
      </label>
      <label>
        일자
        <input name="date" type="date" value={form.date} onChange={handleChange} required />
      </label>
      <button type="submit">추가하기</button>
    </form>
  );
};

export default InputForm;
