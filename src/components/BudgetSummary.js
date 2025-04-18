// src/components/BudgetSummary.js
import React, { useEffect, useState } from "react";
import { saveMonthlyBudget, fetchMonthlySummary } from "../api/budgetApi";
import "./BudgetSummary.css";

const BudgetSummary = () => {
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [budget, setBudget] = useState("");
    const [spent, setSpent] = useState(0);
    const [loading, setLoading] = useState(false);
    const percent = Number(budget) > 0
        ? Math.round((spent / Number(budget)) * 100)
        : 0;

    const [animatedPercent, setAnimatedPercent] = useState(0);

    useEffect(() => {
        let start = null;
        const target = percent;
        const duration = 1000; // 1초
        const max = 5000; // 최대 5000%까지 허용 (선택 사항)

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = target * progress;

            setAnimatedPercent(current > max ? max : current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        setAnimatedPercent(0); // 초기화
        requestAnimationFrame(animate);
    }, [percent]);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const res = await fetchMonthlySummary(month);
            if (res.status === "success") {
                setBudget(res.budget.toString());
                setSpent(res.spent);
            } else {
                alert("데이터 불러오기 실패: " + res.message);
            }
        } catch (err) {
            alert("요청 실패: " + err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadSummary();
    }, [month]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await saveMonthlyBudget(month, budget);
        if (res.status === "success") {
            alert("예산이 저장되었습니다!");
            loadSummary(); // 저장 후 요약 정보 다시 불러오기
        } else {
            alert("저장 실패: " + res.message);
        }
    };


    return (
        <div className="budget-container">
            <h3>{month} 예산 요약</h3>
            <form onSubmit={handleSubmit} className="budget-form">
                <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="예산 (₩)"
                    value={Number(budget).toLocaleString()}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, ""); // 숫자만 추출
                        setBudget(raw);
                    }}
                    required
                />
                <button type="submit">저장</button>
            </form>

            {loading ? (
                <p>불러오는 중...</p>
            ) : (
                <div className="progress-wrapper">
                    <div className="progress-bar">
                        <div
                            className={`fill ${percent > 100 ? "over" : ""}`}
                            style={{ height: `${Math.min(animatedPercent, 100)}%` }}
                        >
                            <span className="percent-label">{Math.round(animatedPercent)}%</span>
                        </div>
                    </div>
                    {percent > 100 && (
                        <div className="budget-warning">⚠ 예산을 초과했습니다!</div>
                    )}
                    <div className="summary-text">
                        사용: {spent.toLocaleString()}원 / 예산: {Number(budget).toLocaleString()}원
                    </div>
                </div>

            )}
        </div>
    );
};

export default BudgetSummary;
