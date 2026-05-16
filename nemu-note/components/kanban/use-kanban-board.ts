import { useCallback, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";

import { MOCK_BOARD } from "./mock-data";
import type { Board, Column, Task } from "./types";

const uid = () => crypto.randomUUID();

function replaceColumn(board: Board, idx: number, next: Column): Board {
  const cols = board.columns.slice();
  cols[idx] = next;
  return { columns: cols };
}

function findColumnIdxByTaskId(board: Board, taskId: string): number {
  return board.columns.findIndex((c) => c.tasks.some((t) => t.id === taskId));
}

export type MoveTaskTarget = "task" | "column";

export function useKanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null);

  const createBoard = useCallback(() => setBoard(MOCK_BOARD), []);

  const addColumn = useCallback((title: string) => {
    setBoard((prev) =>
      prev ? { columns: [...prev.columns, { id: uid(), title, tasks: [] }] } : prev,
    );
  }, []);

  const addTask = useCallback((colId: string, title: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = prev.columns.findIndex((c) => c.id === colId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: [...col.tasks, { id: uid(), title }],
      });
    });
  }, []);

  const renameTask = useCallback((taskId: string, title: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = findColumnIdxByTaskId(prev, taskId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      });
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = findColumnIdxByTaskId(prev, taskId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      });
    });
  }, []);

  const colorColumn = useCallback((colId: string, color: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = prev.columns.findIndex((c) => c.id === colId);
      if (idx === -1) return prev;
      return replaceColumn(prev, idx, { ...prev.columns[idx], bgColor: color });
    });
  }, []);

  // Called from onDragOver to move a task within or across columns.
  const moveTask = useCallback(
    (activeId: string, overId: string, target: MoveTaskTarget) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const srcIdx = findColumnIdxByTaskId(prev, activeId);
        if (srcIdx === -1) return prev;

        const dstIdx =
          target === "task"
            ? findColumnIdxByTaskId(prev, overId)
            : prev.columns.findIndex((c) => c.id === overId);
        if (dstIdx === -1) return prev;

        const srcCol = prev.columns[srcIdx];
        const task = srcCol.tasks.find((t) => t.id === activeId);
        if (!task) return prev;

        // Reorder within the same column.
        if (srcIdx === dstIdx && target === "task") {
          const from = srcCol.tasks.findIndex((t) => t.id === activeId);
          const to = srcCol.tasks.findIndex((t) => t.id === overId);
          return replaceColumn(prev, srcIdx, {
            ...srcCol,
            tasks: arrayMove(srcCol.tasks, from, to),
          });
        }

        // Cross-column move: insert at target task index, or append when dropped on column body.
        const dstCol = prev.columns[dstIdx];
        const dstTasks: Task[] = dstCol.tasks.slice();
        if (target === "task") {
          const insertAt = dstCol.tasks.findIndex((t) => t.id === overId);
          dstTasks.splice(insertAt, 0, task);
        } else {
          dstTasks.push(task);
        }

        const cols = prev.columns.slice();
        cols[srcIdx] = { ...srcCol, tasks: srcCol.tasks.filter((t) => t.id !== activeId) };
        cols[dstIdx] = { ...dstCol, tasks: dstTasks };
        return { columns: cols };
      });
    },
    [],
  );

  const reorderColumns = useCallback((activeId: string, overId: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const from = prev.columns.findIndex((c) => c.id === activeId);
      const to = prev.columns.findIndex((c) => c.id === overId);
      if (from === -1 || to === -1) return prev;
      return { columns: arrayMove(prev.columns, from, to) };
    });
  }, []);

  return {
    board,
    createBoard,
    addColumn,
    addTask,
    renameTask,
    deleteTask,
    colorColumn,
    moveTask,
    reorderColumns,
  };
}
