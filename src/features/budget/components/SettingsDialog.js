import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  FormControlLabel,
  Checkbox,
  Tabs,
  Tab,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import {
  fetchCategories,
  addCategory,
  softDeleteCategory,
  updateCategoriesSort,
  updateCategory,
  fetchFixedCosts,
  addFixedCost,
  updateFixedCost,
  deleteFixedCost,
} from "../../../api/budgetApi";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./SettingsDialog.css";
import FixedCostForm from "@/features/budget/components/FixedCostForm";
import FixedCostCard from "@/features/budget/components/FixedCostCard";

function generateRandomCode() {
  const random = Math.random().toString(36).substring(2, 6);
  const timestamp = Date.now().toString(36).slice(-4);
  return `cat_${random}${timestamp}`;
}

// 🔁 SortableItem (인라인 수정 지원)
function SortableItem({
  item,
  index,
  onDelete,
  onEditStart,
  onEditSave,
  onEditCancel,
  editing,
  editValue,
  setEditValue,
  editSharedTotal, // ✅ 추가
  setEditSharedTotal, // ✅ 추가
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: editing ? "2px solid #f4a8a8" : "1px solid #ddd",
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "8px",
    backgroundColor: editing ? "#fff7f0" : "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  return (
    <div
      className={`sortable-item ${editing ? "editing" : ""}`}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div className="drag-handle" {...listeners}>
        ☰
      </div>

      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {editing ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TextField
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                size="small"
                fullWidth
                margin="dense"
                InputProps={{
                  style: { fontSize: 14 },
                }}
              />
              <IconButton
                onClick={() => onEditSave(item.code)}
                size="small"
                style={{ padding: 6 }}
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={onEditCancel}
                size="small"
                style={{ padding: 6 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: 1,
                gap: 4,
              }}
            >
              <Checkbox
                checked={editSharedTotal}
                onChange={(e) => setEditSharedTotal(e.target.checked)}
                size="small"
                sx={{ padding: "4px" }} // ✅ MUI spacing 최소화
              />
              <span
                style={{
                  fontFamily: "GmarketSansMedium",
                  fontSize: "13px",
                  whiteSpace: "nowrap",
                }}
              >
                누적보기
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="item-text-primary">{item.description}</div>
            <div className="item-text-secondary">정렬 순서: {index}</div>
          </>
        )}
      </div>

      {!editing && (
        <div style={{ display: "flex", gap: "4px" }}>
          <IconButton onClick={() => onEditStart(item)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton onClick={() => onDelete(item.code)} size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

// ⚙ SettingsDialog 메인
function SettingsDialog({
  open,
  onClose,
  onCategoryChange,
  userId,
  groupId,
  userColor = "#f4a8a8",
  hoverColor = "#f19191",
}) {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ description: "", sort: 0 });
  const [activeId, setActiveId] = useState(null);

  const [editingCode, setEditingCode] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editSharedTotal, setEditSharedTotal] = useState(false);

  // 고정비용 관리 상태
  const [fixedCosts, setFixedCosts] = useState([]);
  const [newFixed, setNewFixed] = useState({
    category: "",
    amount: "",
    memo: "",
    day: 1,
  });
  const [editingFixedId, setEditingFixedId] = useState(null);
  const [editFixed, setEditFixed] = useState({
    category: "",
    amount: "",
    memo: "",
    day: 1,
    active: true,
  });

  const inputStyle = {
    minWidth: 0,
    width: "100%",
    fontFamily: "S-CoreDream-3Light",
    fontSize: 15,
    marginBottom: 8,
  };

  const selectStyle = {
    ...inputStyle,
    marginBottom: 8,
  };

  const labelStyle = {
    fontWeight: 600,
    color: userColor,
    fontSize: 15,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  const headerStyle = {
    display: "flex",
    alignItems: "center",
    fontWeight: 700,
    fontSize: 14,
    color: userColor,
    background: "#fafafa",
    borderBottom: "1px solid #eee",
    padding: "8px 0 8px 8px",
  };

  const columnFlex = {
    category: { flex: 2, minWidth: 80 },
    amount: { flex: 1, minWidth: 60 },
    memo: { flex: 2, minWidth: 80 },
    day: { flex: 1, minWidth: 40 },
    active: { flex: 1, minWidth: 40 },
    actions: { flex: 2, minWidth: 100, textAlign: "right", paddingRight: 8 },
  };

  // CSS 변수 설정
  useEffect(() => {
    document.documentElement.style.setProperty("--main-color", userColor);
    document.documentElement.style.setProperty("--hover-color", hoverColor);
    document.documentElement.style.setProperty("--active-color", "#e87a7a");
  }, [userColor, hoverColor]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 0 },
    })
  );

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories({
        userId: userId ?? null,
        groupId: groupId ?? null,
      });
      const sorted = [...data].sort((a, b) => a.sort - b.sort);
      setCategories(sorted);
    } catch (err) {
      console.error("카테고리 로딩 실패:", err);
    }
  }, [userId, groupId]); // ✅ 의존성 포함

  useEffect(() => {
    if (open && (userId || groupId)) loadCategories();
  }, [open, userId, groupId, loadCategories]); // ✅ 안전하게 추가됨

  // 고정비용 목록 불러오기
  const loadFixedCosts = useCallback(async () => {
    try {
      const data = await fetchFixedCosts(userId, groupId);
      setFixedCosts(data);
    } catch (err) {
      console.error("고정비용 로딩 실패:", err);
    }
  }, [userId, groupId]);

  useEffect(() => {
    if (open && (userId || groupId)) loadFixedCosts();
  }, [open, userId, groupId, loadFixedCosts]);

  const handleAdd = async () => {
    const code = generateRandomCode();
    const maxSort =
      categories.length > 0 ? Math.max(...categories.map((c) => c.sort)) : 0;
    await addCategory(
      { ...newCategory, code, sort: maxSort + 1 },
      userId,
      groupId
    );
    setNewCategory({ code: "", description: "", sort: 0 });
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleDelete = async (code) => {
    await softDeleteCategory(code, userId, groupId);
    await loadCategories();
    if (onCategoryChange) onCategoryChange();
  };

  const handleEditStart = (item) => {
    setEditingCode(item.code);
    setEditValue(item.description);
    setEditSharedTotal(!!item.is_shared_total); // ✅ 체크박스 초기값
  };

  const handleEditCancel = () => {
    setEditingCode(null);
    setEditValue("");
  };

  const handleEditSave = async (code) => {
    if (!editValue.trim()) return;
    try {
      await updateCategory(
        code,
        {
          description: editValue,
          is_shared_total: editSharedTotal,
        },
        userId,
        groupId
      );
      await loadCategories();
      setEditingCode(null);
      setEditValue("");
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      alert("수정 중 오류 발생");
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.code === active.id);
    const newIndex = categories.findIndex((c) => c.code === over.id);

    const newItems = arrayMove(categories, oldIndex, newIndex).map(
      (item, idx) => ({
        ...item,
        sort: idx,
      })
    );

    setCategories(newItems);

    try {
      await updateCategoriesSort(newItems, userId, groupId);
      if (onCategoryChange) onCategoryChange();
    } catch (err) {
      alert("정렬 순서 저장 중 오류가 발생했습니다.");
    }
  };

  // 고정비용 추가
  const handleAddFixed = async () => {
    if (!newFixed.category || !newFixed.amount || !newFixed.day) return;
    await addFixedCost({
      ...newFixed,
      amount: parseInt(newFixed.amount, 10),
      userId,
      groupId,
    });
    setNewFixed({ category: "", amount: "", memo: "", day: 1 });
    await loadFixedCosts();
  };
  // 고정비용 수정 시작
  const handleEditFixedStart = (item) => {
    setEditingFixedId(item.id);
    setEditFixed({
      category: item.category,
      amount: item.amount.toString(),
      memo: item.memo || "",
      day: item.day,
      active: item.active,
    });
  };
  // 고정비용 수정 취소
  const handleEditFixedCancel = () => {
    setEditingFixedId(null);
    setEditFixed({ category: "", amount: "", memo: "", day: 1, active: true });
  };
  // 고정비용 저장
  const handleEditFixedSave = async (id) => {
    await updateFixedCost(id, {
      ...editFixed,
      amount: parseInt(editFixed.amount, 10),
    });
    setEditingFixedId(null);
    await loadFixedCosts();
  };
  // 고정비용 삭제
  const handleDeleteFixed = async (id) => {
    await deleteFixedCost(id);
    await loadFixedCosts();
  };

  const [activeTab, setActiveTab] = useState(0); // 0: 카테고리, 1: 고정비용

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>환경 설정</DialogTitle>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
        sx={{ borderBottom: "1.5px solid #eee", mb: 1 }}
      >
        <Tab
          label="카테고리 관리"
          sx={{
            fontWeight: 700,
            fontFamily: "GmarketSansMedium",
            fontSize: 16,
            color: userColor,
          }}
        />
        <Tab
          label="고정비용 관리"
          sx={{
            fontWeight: 700,
            fontFamily: "GmarketSansMedium",
            fontSize: 16,
            color: userColor,
          }}
        />
      </Tabs>
      <DialogContent className="settings-dialog-content">
        {activeTab === 0 && (
          <>
            {/* ✅ DND 시작 */}
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
                      onEditStart={handleEditStart}
                      onEditSave={handleEditSave}
                      onEditCancel={handleEditCancel}
                      editing={editingCode === cat.code}
                      editValue={editValue}
                      setEditValue={setEditValue}
                      editSharedTotal={editSharedTotal}
                      setEditSharedTotal={setEditSharedTotal}
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
                        {categories.find((c) => c.code === activeId)
                          ?.description || ""}
                      </div>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
            {/* ✅ 새 카테고리 추가 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                marginTop: "12px",
              }}
            >
              <TextField
                label="카테고리"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    description: e.target.value,
                  })
                }
                margin="dense"
                style={{ flexGrow: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newCategory.is_shared_total}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        is_shared_total: e.target.checked,
                      })
                    }
                    color="primary"
                    size="small"
                  />
                }
                label="누적보기"
                className="category-checkbox-label"
              />
            </div>
            <Button
              onClick={handleAdd}
              className="settings-button"
              variant="contained"
              style={{
                marginTop: 12,
                background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
              }}
            >
              카테고리 추가
            </Button>
          </>
        )}
        {activeTab === 1 && (
          <>
            <FixedCostForm
              categories={categories}
              userColor={userColor}
              hoverColor={hoverColor}
              onSubmit={async (payload) => {
                // 기존 handleAddFixed 로직과 동일하게 처리
                await addFixedCost({
                  ...payload,
                  userId,
                  groupId,
                });
                await loadFixedCosts();
              }}
            />

            {/* 목록 카드 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                maxHeight: 400,
                overflowY: "auto",
                padding: "8px 0",
              }}
            >
              {fixedCosts.map((item) => (
                <FixedCostCard
                  key={item.id}
                  item={item}
                  categories={categories}
                  userColor={userColor}
                  hoverColor={hoverColor}
                  onEdit={() => handleEditFixedStart(item)}
                  onDelete={() => handleDeleteFixed(item.id)}
                />
              ))}
            </div>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          style={{
            background: `linear-gradient(135deg, ${userColor} 0%, ${hoverColor} 100%)`,
            color: "white",
          }}
        >
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SettingsDialog;
