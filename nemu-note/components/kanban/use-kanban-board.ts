import { useCallback, useRef, useState } from "react";

import { arrayMove } from "@dnd-kit/sortable";

import { api } from "@/lib/api";
import { useDebouncedCallback } from "@/lib/debounce";

import type { Board, Column, Task } from "./types";

// ─── transformer ─────────────────────────────────────────────────────────────

function toBoard(data: any): Board {
  return {
    columns: [...(data.columns ?? [])]
      .sort((a: any, b: any) => a.order - b.order)
      .map((col: any) => ({
        id:      col._id,
        title:   col.title,
        bgColor: col.bgColor,
        tasks: [...(col.tasks ?? [])]
          .sort((a: any, b: any) => a.order - b.order)
          .map((t: any) => ({
            id:     t._id,
            title:  t.title,
            tagIds: (t.tagIds ?? []).map((tag: any) =>
              typeof tag === "string" ? tag : tag._id,
            ),
          })),
      })),
  };
}

// ─── local helpers ────────────────────────────────────────────────────────────

function replaceColumn(board: Board, idx: number, next: Column): Board {
  const cols = board.columns.slice();
  cols[idx] = next;
  return { columns: cols };
}

function findColIdxByTaskId(board: Board, taskId: string): number {
  return board.columns.findIndex((c) => c.tasks.some((t) => t.id === taskId));
}

export type MoveTaskTarget = "task" | "column";

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useKanbanBoard() {
  const [board, setBoard] = useState<Board | null>(null);

  const boardIdRef = useRef<string | null>(null);
  const dragStartColRef  = useRef<string | null>(null);

  // ── internal: refetch board from server ──────────────────────────────────────

  const refreshBoard = useCallback(async (id: string) => {
    const boards = await api.get<any[]>("/boards");
    const fresh  = boards.find((b: any) => b._id === id) ?? boards[0];
    if (fresh) setBoard(toBoard(fresh));
  }, []);

  // ── load ─────────────────────────────────────────────────────────────────────

  const loadBoard = useCallback(async () => {
    try {
      const boards = await api.get<any[]>("/boards");
      if (boards.length > 0) {
        const b = boards[0];
        boardIdRef.current = b._id;
        setBoard(toBoard(b));
      } else {
        const created = await api.post<any>("/boards", { name: "My Board" });
        boardIdRef.current = created._id;
        setBoard(toBoard(created));
      }
    } catch (err) {
      console.error("[Kanban] loadBoard failed:", err);
    }
  }, []);

  // ── column mutations ─────────────────────────────────────────────────────────

  const addColumn = useCallback(async (title: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    await api.post(`/boards/${id}/columns`, { title });
    await refreshBoard(id);
  }, [refreshBoard]);

  const colorColumnApi = useCallback(async (colId: string, color: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    await api.patch(`/boards/${id}/columns/${colId}`, { bgColor: color }).catch(console.error);
    await refreshBoard(id);
  }, [refreshBoard]);

  const colorColumnApiDebounced = useDebouncedCallback(colorColumnApi, 400);

  const colorColumn = useCallback((colId: string, color: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = prev.columns.findIndex((c) => c.id === colId);
      if (idx === -1) return prev;
      return replaceColumn(prev, idx, { ...prev.columns[idx], bgColor: color });
    });
    colorColumnApiDebounced(colId, color);
  }, [colorColumnApiDebounced]);

  // ── task mutations ────────────────────────────────────────────────────────────

  const addTask = useCallback(async (colId: string, title: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    await api.post(`/boards/${id}/columns/${colId}/tasks`, { title });
    await refreshBoard(id);
  }, [refreshBoard]);

  const renameTask = useCallback(async (taskId: string, title: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = findColIdxByTaskId(prev, taskId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: col.tasks.map((t) => (t.id === taskId ? { ...t, title } : t)),
      });
    });
    await api.patch(`/boards/${id}/tasks/${taskId}`, { title }).catch(console.error);
    await refreshBoard(id);
  }, [refreshBoard]);

  const deleteTask = useCallback(async (taskId: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    setBoard((prev) => {
      if (!prev) return prev;
      const idx = findColIdxByTaskId(prev, taskId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      });
    });
    await api.delete(`/boards/${id}/tasks/${taskId}`).catch(console.error);
    await refreshBoard(id);
  }, [refreshBoard]);

  const toggleTaskTag = useCallback(async (taskId: string, tagId: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    let nextTagIds: string[] = [];

    setBoard((prev) => {
      if (!prev) return prev;
      const idx = findColIdxByTaskId(prev, taskId);
      if (idx === -1) return prev;
      const col = prev.columns[idx];
      return replaceColumn(prev, idx, {
        ...col,
        tasks: col.tasks.map((t): Task => {
          if (t.id !== taskId) return t;
          const existing = t.tagIds ?? [];
          nextTagIds = existing.includes(tagId)
            ? existing.filter((tid) => tid !== tagId)
            : [...existing, tagId];
          return { ...t, tagIds: nextTagIds };
        }),
      });
    });

    await api
      .patch(`/boards/${id}/tasks/${taskId}`, { tagIds: nextTagIds })
      .catch(console.error);
    await refreshBoard(id);
  }, [refreshBoard]);

  // ── DnD — local only during drag ─────────────────────────────────────────────

  const recordDragStart = useCallback((taskId: string) => {
    setBoard((prev) => {
      if (!prev) return prev;
      const col = prev.columns.find((c) => c.tasks.some((t) => t.id === taskId));
      dragStartColRef.current = col?.id ?? null;
      return prev;
    });
  }, []);

  const moveTask = useCallback(
    (activeId: string, overId: string, target: MoveTaskTarget) => {
      setBoard((prev) => {
        if (!prev) return prev;
        const srcIdx = findColIdxByTaskId(prev, activeId);
        if (srcIdx === -1) return prev;

        const dstIdx =
          target === "task"
            ? findColIdxByTaskId(prev, overId)
            : prev.columns.findIndex((c) => c.id === overId);
        if (dstIdx === -1) return prev;

        const srcCol = prev.columns[srcIdx];
        const task   = srcCol.tasks.find((t) => t.id === activeId);
        if (!task) return prev;

        if (srcIdx === dstIdx && target === "task") {
          const from = srcCol.tasks.findIndex((t) => t.id === activeId);
          const to   = srcCol.tasks.findIndex((t) => t.id === overId);
          return replaceColumn(prev, srcIdx, {
            ...srcCol,
            tasks: arrayMove(srcCol.tasks, from, to),
          });
        }

        const dstCol    = prev.columns[dstIdx];
        const dstTasks: Task[] = dstCol.tasks.slice();
        if (target === "task") {
          dstTasks.splice(dstCol.tasks.findIndex((t) => t.id === overId), 0, task);
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
      const to   = prev.columns.findIndex((c) => c.id === overId);
      if (from === -1 || to === -1) return prev;
      return { columns: arrayMove(prev.columns, from, to) };
    });
  }, []);

  // ── sync to API after dragEnd — refetch once drop is committed ───────────────

  const syncTaskDrop = useCallback(async (taskId: string) => {
    const id = boardIdRef.current;
    if (!id) return;
    let toColId  = "";
    let newOrder = 0;

    setBoard((prev) => {
      if (!prev) return prev;
      const toCol = prev.columns.find((c) => c.tasks.some((t) => t.id === taskId));
      if (toCol) {
        toColId  = toCol.id;
        newOrder = toCol.tasks.findIndex((t) => t.id === taskId);
      }
      return prev;
    });

    if (toColId) {
      await api
        .patch(`/boards/${id}/tasks/${taskId}/move`, { toColId, newOrder })
        .catch(console.error);
      await refreshBoard(id);
    }
  }, [refreshBoard]);

  const syncColumnReorder = useCallback(
    async (orderedIds: string[]) => {
      const id = boardIdRef.current;
      if (!id) return;
      await api
        .patch(`/boards/${id}/columns/reorder`, { orderedIds })
        .catch(console.error);
      await refreshBoard(id);
    },
    [refreshBoard],
  );

  return {
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
  };
}
