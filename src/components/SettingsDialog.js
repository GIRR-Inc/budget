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
  updateCategoriesSort
} from "../api/budgetApi";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ddd",
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    backgroundColor: "#fff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };

  return (
    <div
      ref={setNodeRef}
      className="sortable-item"
      style={style}
      {...attributes}
      {...listeners}
    >
      <div>
        <div className="item-text-primary">{item.description}</div>
        <div className="item-text-secondary">정렬 순서: {index}</div>
      </div>
      <IconButton onClick={() => onDelete(item.code)}>
        <DeleteIcon />
      </IconButton>
    </div>
  );
}

function SettingsDialog({ open, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ description: "", sort: 0 });

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async () => {
    const data = await fetchCategories();
    const sorted = [...data].sort((a, b) => a.sort - b.sort);
    setCategories(sorted);
  };

  const handleAdd = async () => {
    const code = generateRandomCode();
    const maxSort =
      categories.length > 0 ? Math.max(...categories.map((c) => c.sort)) : 0;
    await addCategory({ ...newCategory, code, sort: maxSort + 1 });
    setNewCategory({ code: "", description: "", sort: 0 });
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleDelete = async (code) => {
    await softDeleteCategory(code);
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const oldIndex = categories.findIndex(c => c.code === active.id);
    const newIndex = categories.findIndex(c => c.code === over.id);
  
    const newItems = arrayMove(categories, oldIndex, newIndex)
      .map((item, idx) => ({ ...item, sort: idx }));
  
    setCategories(newItems);
  
    try {
      await updateCategoriesSort(newItems); // 🟢 서버 저장
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
