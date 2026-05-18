"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";

import { useTagStore } from "@/store/use-tag-store";
import ColorPicker from "@/components/color-picker";

import { InlineAddForm } from "./kanban/inline-add-form";
import { KanbanColumn } from "./kanban/kanban-column";
import { DragType, type Task } from "./kanban/types";
import { useKanbanBoard } from "./kanban/use-kanban-board";

export default function KanbanBoard() {
  const {
    board,
    loadBoard,
    addColumn,
    addTask,
    renameTask,
    deleteTask,
    colorColumn,
    toggleTaskTag,
    recordDragStart,
    moveTask,
    reorderColumns,
    syncTaskDrop,
    syncColumnReorder,
  } = useKanbanBoard();

  const { fetchTags } = useTagStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [boardBg, setBoardBg]       = useState<string | null>(null);

  // โหลด board และ tags เมื่อ component mount
  useEffect(() => {
    loadBoard();
    fetchTags();
  }, [loadBoard, fetchTags]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      if (active.data.current?.type === DragType.Task) {
        const task = active.data.current.task as Task;
        setActiveTask(task);
        recordDragStart(task.id);
      }
    },
    [recordDragStart],
  );

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over || active.id === over.id) return;
      if (active.data.current?.type !== DragType.Task) return;

      const overType = over.data.current?.type;
      if (overType === DragType.Task)
        moveTask(String(active.id), String(over.id), "task");
      else if (overType === DragType.Column)
        moveTask(String(active.id), String(over.id), "column");
    },
    [moveTask],
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      setActiveTask(null);
      if (!over || active.id === over.id) return;

      if (active.data.current?.type === DragType.Column) {
        // คำนวณ orderedIds จาก board state ปัจจุบันก่อนที่ reorderColumns จะ update
        const cols = board?.columns ?? [];
        const from = cols.findIndex((c) => c.id === String(active.id));
        const to   = cols.findIndex((c) => c.id === String(over.id));
        const orderedIds = arrayMove(cols.map((c) => c.id), from, to);

        reorderColumns(String(active.id), String(over.id));
        syncColumnReorder(orderedIds);
      } else if (active.data.current?.type === DragType.Task) {
        syncTaskDrop(String(active.id));
      }
    },
    [board, reorderColumns, syncColumnReorder, syncTaskDrop],
  );

  const columnIds = useMemo(
    () => board?.columns.map((c) => c.id) ?? [],
    [board?.columns],
  );

  if (!board) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-sm text-default-400">กำลังโหลด board…</p>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      sensors={sensors}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <BoardToolbar bgColor={boardBg} onChange={setBoardBg} onReset={() => setBoardBg(null)} />

      <div
        className="flex gap-4 overflow-x-auto rounded-xl p-4 pb-4 transition-colors"
        style={{ backgroundColor: boardBg ?? undefined }}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {board.columns.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              onAddTask={addTask}
              onColorChange={colorColumn}
              onDeleteTask={deleteTask}
              onRenameTask={renameTask}
              onToggleTag={toggleTaskTag}
            />
          ))}
        </SortableContext>

        <div className="w-72 shrink-0">
          <InlineAddForm
            placeholder="Column title…"
            triggerClassName="flex w-full items-center gap-2 rounded-xl border-2 border-dashed border-default-300 px-4 py-3 text-sm text-default-400 transition-colors hover:border-default-400 hover:text-default-600"
            triggerLabel="+ Add column"
            onSubmit={addColumn}
          />
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-2 rounded-lg border border-default-200 bg-content1 p-3 opacity-90 shadow-xl">
            <p className="text-sm">{activeTask.title}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

type ToolbarProps = { bgColor: string | null; onChange: (c: string) => void; onReset: () => void };

function BoardToolbar({ bgColor, onChange, onReset }: ToolbarProps) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <span className="text-xs text-default-500">Board color</span>
      <ColorPicker value={bgColor ?? "#ffffff"} onChange={onChange} />
      {bgColor && (
        <button className="text-xs text-default-400 hover:text-default-600" type="button" onClick={onReset}>
          Reset
        </button>
      )}
    </div>
  );
}
