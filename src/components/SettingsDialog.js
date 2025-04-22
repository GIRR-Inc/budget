import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchCategories,
  addCategory,
  softDeleteCategory,
  updateCategoriesSort,
} from "../api/budgetApi";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragOverlay
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./SettingsDialog.css";

function generateRandomCode() {
  const random = Math.random().toString(36).substring(2, 6);
  const timestamp = Date.now().toString(36).slice(-4);
  return `cat_${random}${timestamp}`;
}

// 🔁 SortableItem component
function SortableItem({ item, index, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.code });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      border: "1px solid #ddd",
      padding: "12px",
      marginBottom: "8px",
      borderRadius: "8px",
      backgroundColor: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };

  return (
    <div className="sortable-item" ref={setNodeRef} style={style} {...attributes}>
      {/* ⬇ 드래그 핸들에만 listeners 붙임 */}
      <div className="drag-handle" {...listeners} style={{ cursor: "grab", paddingRight: "8px" }}>
        ☰
      </div>

      <div style={{ flexGrow: 1 }}>
        <div className="item-text-primary">{item.description}</div>
        <div className="item-text-secondary">정렬 순서: {index}</div>
      </div>

      <IconButton onClick={() => onDelete(item.code)}>
        <DeleteIcon />
      </IconButton>
    </div>
  );
}

function SettingsDialog({ open, onClose, onCategoryChange, userId  }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ description: "", sort: 0 });
  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    console.log("드래그 시작됨!");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 0,
      },
    })
  );

  useEffect(() => {
    if (open && userId) loadCategories();
  }, [open, userId]);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories(userId); // ✅ 전달
      const sorted = [...data].sort((a, b) => a.sort - b.sort);
      setCategories(sorted);
    } catch (err) {
      console.error("카테고리 로딩 실패:", err);
    }
  };

  const handleAdd = async () => {
    const code = generateRandomCode();
    const maxSort =
      categories.length > 0 ? Math.max(...categories.map((c) => c.sort)) : 0;
    await addCategory({ ...newCategory, code, sort: maxSort + 1 }, userId); // ✅ 전달
    setNewCategory({ code: "", description: "", sort: 0 });
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleDelete = async (code) => {
    await softDeleteCategory(code, userId); // ✅ 전달
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.code === active.id);
    const newIndex = categories.findIndex((c) => c.code === over.id);

    const newItems = arrayMove(categories, oldIndex, newIndex).map(
      (item, idx) => ({ ...item, sort: idx })
    );

    setCategories(newItems);

    try {
      await updateCategoriesSort(newItems, userId); // ✅ 전달
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      alert("정렬 순서 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>환경 설정 - 카테고리 관리</DialogTitle>
      <DialogContent dividers className="settings-dialog-content">
      <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
            <SortableContext
              items={categories.map((c) => c.code)}
              strategy={verticalListSortingStrategy}
            >
            <div className="settings-list-wrapper">
              {categories.map((cat, index) => (
                <SortableItem
                  key={cat.code}
                  item={cat}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
    {activeId ? (
      <div className="sortable-item drag-preview">
        <div className="drag-handle">☰</div>
        <div style={{ flexGrow: 1 }}>
          <div className="item-text-primary">
            {
              categories.find((c) => c.code === activeId)?.description || ""
            }
          </div>
        </div>
      </div>
    ) : null}
  </DragOverlay>
        </DndContext>

        <TextField
          className="settings-input"
          label="카테고리"
          value={newCategory.description}
          onChange={(e) =>
            setNewCategory({ ...newCategory, description: e.target.value })
          }
          fullWidth
          margin="dense"
        />
        <Button
          onClick={handleAdd}
          className="settings-button"
          variant="contained"
          style={{ marginTop: 12 }}
        >
          카테고리 추가
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
