// src/components/BudgetSummary.js
import React, { useEffect, useState } from "react";
import { saveMonthlyBudget, fetchMonthlySummary } from "../api";
import "./BudgetSummary.css";

const BudgetSummary = () => {
    const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [budget, setBudget] = useState("");
    const [spent, setSpent] = useState(0);
    const [loading, setLoading] = useState(false);
    const percent = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

    const [animatedPercent, setAnimatedPercent] = useState(0);

    useEffect(() => {
        let frame = 0;
        const target = percent;
        const duration = 500; // 0.5초
        const frameCount = 30;
        const increment = target / frameCount;

        const animate = () => {
            frame++;
            setAnimatedPercent((prev) => {
                const next = prev + increment;
                return next >= target ? target : next;
            });
            if (frame < frameCount) {
                requestAnimationFrame(animate);
            }
        };

        setAnimatedPercent(0); // 초기화 후 시작
        animate();
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
            loadSummary();
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
                    type="number"
                    placeholder="예산 (₩)"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                />
                <button type="submit">저장</button>
            </form>

            {loading ? (
                <p>불러오는 중...</p>
            ) : (
                <div className="progress-wrapper">
                    <div className="progress-bar">
                        <div className="fill" style={{ height: `${animatedPercent}%` }}>
                            <span className="percent-label">{Math.round(animatedPercent)}%</span>
                        </div>
                    </div>
                    <div className="summary-text">
                        사용: {spent.toLocaleString()}원 / 예산: {Number(budget).toLocaleString()}원
                    </div>
                </div>

            )}
        </div>
    );
};

export default BudgetSummary;
