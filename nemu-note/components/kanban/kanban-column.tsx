"use client";

import { memo, useMemo } from "react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import ColorPicker from "@/components/color-picker";

import { InlineAddForm } from "./inline-add-form";
import { TaskCard } from "./task-card";
import { DragType, type Column } from "./types";

type Props = {
  column: Column;
  onAddTask: (colId: string, title: string) => void;
  onRenameTask: (taskId: string, title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onColorChange: (colId: string, color: string) => void;
  onToggleTag: (taskId: string, tagId: string) => void;
};

function KanbanColumnImpl({
  column,
  onAddTask,
  onRenameTask,
  onDeleteTask,
  onColorChange,
  onToggleTag,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: DragType.Column },
  });

  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: column.bgColor ?? undefined,
      }}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border border-default-200 bg-content2 p-4"
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag column"
          className="cursor-grab touch-none select-none text-default-300 active:cursor-grabbing"
          tabIndex={-1}
          type="button"
        >
          ⠿
        </button>
        <h3 className="flex-1 text-sm font-semibold">{column.title}</h3>
        <span className="rounded-full bg-default-200 px-2 py-0.5 text-xs text-default-500">
          {column.tasks.length}
        </span>
        <ColorPicker
          value={column.bgColor ?? "#ffffff"}
          onChange={(color) => onColorChange(column.id, color)}
        />
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask}
              onRename={onRenameTask}
              onToggleTag={onToggleTag}
            />
          ))}
        </div>
      </SortableContext>

      <InlineAddForm
        placeholder="Task title…"
        triggerLabel="+ Add task"
        onSubmit={(title) => onAddTask(column.id, title)}
      />
    </div>
  );
}

export const KanbanColumn = memo(KanbanColumnImpl);
