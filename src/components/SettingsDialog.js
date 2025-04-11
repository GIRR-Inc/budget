import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, List, ListItem, ListItemText, IconButton
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  fetchCategories,
  addCategory,
  softDeleteCategory 
} from "../api/budgetApi";
import "./SettingsDialog.css";

function generateRandomCode() {
  const random = Math.random().toString(36).substring(2, 6); // 알파벳+숫자 4자리
  const timestamp = Date.now().toString(36).slice(-4); // 최근 시간 4자리
  return `cat_${random}${timestamp}`; // 예: cat_kd83fz1a
}

function SettingsDialog({ open, onClose, onCategoryChange }) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({
    description: "",
    sort: 0
  });

  useEffect(() => {
    if (open) loadCategories();
  }, [open]);

  const loadCategories = async () => {
    const data = await fetchCategories();
    setCategories(data);
  };

  const handleAdd = async () => {
      const code = generateRandomCode();

      await addCategory({ ...newCategory, code });
      setNewCategory({ code: "", description: "", sort: 0 });
  
      await loadCategories();
      if (onCategoryChange) onCategoryChange(); // ← 여기 추가
  };

  const handleDelete = async (code) => {
    await softDeleteCategory(code);
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>환경 설정 - 카테고리 관리</DialogTitle>
      <DialogContent dividers className="settings-dialog-content">
        <div className="settings-list-wrapper">
          <List>
            {categories.map((cat) => (
              <ListItem
                key={cat.code}
                secondaryAction={
                  <IconButton onClick={() => handleDelete(cat.code)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={`${cat.description}`}
                  secondary={`정렬 순서: ${cat.sort}`}
                />
              </ListItem>
            ))}
          </List>
        </div>

        <TextField
          className="settings-input"
          label="카테고리"
          value={newCategory.description}
          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
          fullWidth
          margin="dense"
        />
        <TextField
          className="settings-input"
          label="정렬 순서"
          type="number"
          value={newCategory.sort}
          onChange={(e) => setNewCategory({ ...newCategory, sort: Number(e.target.value) })}
          fullWidth
          margin="dense"
        />

        <Button onClick={handleAdd} className="settings-button">
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
