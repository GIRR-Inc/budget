// src/features/budget/components/FixedCostCard.jsx
import React from "react";
import { Button, Checkbox } from "@mui/material";
import styles from "./FixedCostCard.module.css";

export default function FixedCostCard({
  item,
  categories,
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
  onEdit,
  onDelete,
}) {
  const cat =
    categories.find((c) => c.code === item.category)?.description ||
    item.category;

  return (
    <div className={styles.card} style={{ opacity: item.active ? 1 : 0.6 }}>
      <div className={styles.row}>
        <span
          className={styles.title}
          style={{ color: item.active ? userColor : "#bbb" }}
        >
          {cat}
        </span>
        <Checkbox
          checked={item.active}
          disabled
          size="small"
          style={{ color: userColor }}
        />
      </div>

      <div className={styles.row}>
        <span className={styles.amount}>{item.amount.toLocaleString()}원</span>
        <span className={styles.badge}>{item.day}일</span>
      </div>

      {item.memo && (
        <div
          className={styles.memo}
          style={{ borderLeft: `3px solid ${userColor}` }}
        >
          {item.memo}
        </div>
      )}

      <div className={styles.actions}>
        <Button
          size="small"
          onClick={onEdit}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            background: hoverColor,
            color: "#fff",
            px: 1.5,
            py: 0.5,
          }}
        >
          수정
        </Button>
        <Button
          size="small"
          onClick={onDelete}
          sx={{
            borderRadius: 1,
            fontWeight: 600,
            background: "#ff6b6b",
            color: "#fff",
            px: 1.5,
            py: 0.5,
          }}
        >
          삭제
        </Button>
      </div>
    </div>
  );
}
