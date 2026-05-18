"use client";

import { memo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useTagStore } from "@/store/use-tag-store";

import { AddTagPopover } from "./add-tag-popover";
import { TagBadge } from "./tag-badge";
import { DragType, type Task } from "./types";

type Props = {
  task: Task;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onToggleTag: (taskId: string, tagId: string) => void;
};

function TaskCardImpl({ task, onRename, onDelete, onToggleTag }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  const allTags = useTagStore((s) => s.tags);
  const taskTags = allTags.filter((t) => task.tagIds?.includes(t.id));

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: DragType.Task, task },
  });

  function startEdit() {
    setDraft(task.title);
    setIsEditing(true);
  }

  function commitEdit() {
    const v = draft.trim();
    if (v) onRename(task.id, v);
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
      }}
      className="group flex flex-col gap-2 rounded-lg border border-default-200 bg-content1 p-3 shadow-sm"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          aria-label="Drag task"
          className="mt-0.5 cursor-grab touch-none select-none text-default-300 active:cursor-grabbing"
          tabIndex={-1}
          type="button"
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              autoFocus
              aria-label="Task title"
              className="w-full rounded border border-primary-400 bg-transparent px-1 text-sm outline-none"
              value={draft}
              onBlur={commitEdit}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
          ) : (
            <p
              className="cursor-pointer break-words text-sm"
              title="Double-click to rename"
              onDoubleClick={startEdit}
            >
              {task.title}
            </p>
          )}
        </div>

        <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label="Rename task"
            className="text-xs text-default-400 hover:text-primary"
            type="button"
            onClick={startEdit}
          >
            ✎
          </button>
          <button
            aria-label="Delete task"
            className="text-xs text-default-400 hover:text-danger-500"
            type="button"
            onClick={() => onDelete(task.id)}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 pl-5">
        {taskTags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onRemove={() => onToggleTag(task.id, tag.id)}
          />
        ))}
        <AddTagPopover
          selectedTagIds={task.tagIds ?? []}
          onToggle={(tagId) => onToggleTag(task.id, tagId)}
        />
      </div>
    </div>
  );
}

export const TaskCard = memo(TaskCardImpl);
