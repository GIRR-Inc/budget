import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { fetchCategoryMonthlyData } from "../api/budgetApi";
import "./MonthlyChart.css";

const MonthlyChart = ({ userId, groupId, userColor = "#f4a8a8" }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [categoryInfo, setCategoryInfo] = useState({});
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  useEffect(() => {
    const loadChartData = async () => {
      if (!userId && !groupId) return;

      try {
        setLoading(true);
        const result = await fetchCategoryMonthlyData(userId, groupId, 6);
        setChartData(result.data);
        setCategoryInfo(result.categoryInfo);

        // 카테고리 목록 추출
        const categorySet = new Set();
        result.data.forEach((month) => {
          Object.keys(month).forEach((key) => {
            if (key !== "month" && key !== "fullMonth") {
              categorySet.add(key);
            }
          });
        });
        setCategories(Array.from(categorySet));

        // 기본적으로 모든 카테고리 선택
        setSelectedCategories(new Set(categorySet));
      } catch (err) {
        console.error("차트 데이터 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [userId, groupId]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // 현재 월의 데이터 찾기
      const currentMonthData = chartDataWithTotal.find(
        (item) => item.month === label
      );
      const currentIndex = chartDataWithTotal.findIndex(
        (item) => item.month === label
      );

      // 이전 월의 데이터 찾기
      const previousMonthData =
        currentIndex > 0 ? chartDataWithTotal[currentIndex - 1] : null;

      // 비교 정보 계산
      let comparisonInfo = null;
      if (previousMonthData && currentMonthData) {
        const currentAmount = currentMonthData.total;
        const previousAmount = previousMonthData.total;
        const difference = currentAmount - previousAmount;
        const percentageChange =
          previousAmount > 0 ? (difference / previousAmount) * 100 : 0;

        comparisonInfo = {
          difference,
          percentageChange,
          previousAmount,
        };
      }

      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">{payload[0].value.toLocaleString()}원</p>

          {comparisonInfo && (
            <div className="tooltip-comparison">
              <div className="comparison-item">
                <span className="comparison-label">이전달 대비:</span>
                <span
                  className={`comparison-difference ${
                    comparisonInfo.difference > 0
                      ? "increase"
                      : comparisonInfo.difference < 0
                      ? "decrease"
                      : "neutral"
                  }`}
                >
                  {comparisonInfo.difference > 0 ? "+" : ""}
                  {comparisonInfo.difference.toLocaleString()}원
                </span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">변화율:</span>
                <span
                  className={`comparison-percentage ${
                    comparisonInfo.percentageChange > 0
                      ? "increase"
                      : comparisonInfo.percentageChange < 0
                      ? "decrease"
                      : "neutral"
                  }`}
                >
                  {comparisonInfo.percentageChange > 0 ? "+" : ""}
                  {comparisonInfo.percentageChange.toFixed(1)}%
                </span>
              </div>
              <div className="comparison-item">
                <span className="comparison-label">이전달:</span>
                <span className="comparison-previous">
                  {comparisonInfo.previousAmount.toLocaleString()}원
                </span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleCategoryToggle = (category) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
    }
    setSelectedCategories(newSelected);
  };

  if (loading) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">월별 지출 추이</h3>
        <div className="chart-loading">불러오는 중...</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">월별 지출 추이</h3>
        <div className="chart-empty">데이터가 없습니다.</div>
      </div>
    );
  }

  // 선택된 카테고리들의 합계 계산
  const chartDataWithTotal = chartData.map((month) => {
    const total = Array.from(selectedCategories).reduce((sum, category) => {
      return sum + (month[category] || 0);
    }, 0);

    return {
      ...month,
      total: total,
    };
  });

  return (
    <div className="chart-container">
      <h3 className="chart-title">월별 지출 추이</h3>

      {/* 카테고리 선택 */}
      <div className="category-selector">
        <div className="selector-header">
          <span>카테고리 선택</span>
          <div className="selector-buttons">
            <button
              className="select-all-btn"
              onClick={() => setSelectedCategories(new Set(categories))}
            >
              전체 선택
            </button>
            <button
              className="clear-all-btn"
              onClick={() => setSelectedCategories(new Set())}
            >
              전체 해제
            </button>
          </div>
        </div>
        <div className="selected-categories">
          {Array.from(selectedCategories).map((category) => (
            <span key={category} className="selected-category-tag">
              {categoryInfo[category] || category}
              <button
                className="remove-category-btn"
                onClick={() => handleCategoryToggle(category)}
              >
                ×
              </button>
            </span>
          ))}
          {selectedCategories.size === 0 && (
            <span className="no-selection">선택된 카테고리가 없습니다</span>
          )}
        </div>
        <div className="category-dropdown">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !selectedCategories.has(e.target.value)) {
                handleCategoryToggle(e.target.value);
              }
              e.target.value = "";
            }}
          >
            <option value="">카테고리 추가...</option>
            {categories
              .filter((category) => !selectedCategories.has(category))
              .map((category) => (
                <option key={category} value={category}>
                  {categoryInfo[category] || category}
                </option>
              ))}
          </select>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartDataWithTotal}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            stroke="#666"
            fontSize={12}
            fontFamily="'S-CoreDream-3Light'"
          />
          <YAxis
            stroke="#666"
            fontSize={12}
            fontFamily="'S-CoreDream-3Light'"
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}만`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            name="선택된 카테고리 합계"
            stroke={userColor}
            strokeWidth={3}
            dot={{ fill: userColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: userColor, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyChart;
