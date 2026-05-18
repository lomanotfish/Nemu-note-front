"use client";

import { useRef, useState } from "react";
import ColorPicker from "@/components/color-picker";
import { useTagStore, type Tag } from "@/store/use-tag-store";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#64748b",
];

export default function TagsManagement() {
  const { tags, createTag, updateTag, deleteTag } = useTagStore();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    createTag(name, newColor);
    setNewName("");
    newInputRef.current?.focus();
  }

  function startEdit(tag: Tag) {
    setEditingId(tag.id);
    setEditDraft(tag.name);
  }

  function commitEdit(id: string) {
    const name = editDraft.trim();
    if (name) updateTag(id, { name });
    setEditingId(null);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Tags</h2>
        <p className="mt-1 text-sm text-default-500">
          Create and manage tags to categorize tasks on your kanban boards.
        </p>
      </div>

      {/* Create section */}
      <section className="rounded-2xl border border-default-200 bg-content1 p-5">
        <h3 className="mb-4 text-sm font-medium text-default-700">New tag</h3>

        <div className="flex items-center gap-3">
          <ColorPicker value={newColor} onChange={setNewColor} />
          <input
            ref={newInputRef}
            className="flex-1 rounded-xl border border-default-200 bg-default-100 px-3 py-2 text-sm outline-none transition-all placeholder:text-default-400 focus:border-primary-400 focus:bg-content1 focus:shadow-sm"
            maxLength={32}
            placeholder="Tag name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <button
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!newName.trim()}
            type="button"
            onClick={handleCreate}
          >
            Add
          </button>
        </div>

        {/* Quick color presets */}
        <div className="mt-4 flex items-center gap-2.5">
          <span className="text-xs text-default-400">Quick pick:</span>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                aria-label={`Pick color ${c}`}
                className={`h-5 w-5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${newColor === c ? "scale-110 ring-2 ring-primary ring-offset-2" : ""}`}
                style={{ backgroundColor: c }}
                type="button"
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
        </div>

        {/* Live preview */}
        {newName.trim() && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs text-default-400">Preview:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: newColor + "22", color: newColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: newColor }} />
              {newName.trim()}
            </span>
          </div>
        )}
      </section>

      {/* Tags list */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-default-700">
            All tags
            {tags.length > 0 && (
              <span className="ml-2 rounded-full bg-default-200 px-2 py-0.5 text-xs text-default-500">
                {tags.length}
              </span>
            )}
          </h3>
        </div>

        {tags.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-default-200 py-14">
            <span className="text-3xl opacity-40">🏷️</span>
            <div className="text-center">
              <p className="text-sm font-medium text-default-500">No tags yet</p>
              <p className="mt-0.5 text-xs text-default-400">Create your first tag above</p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="group flex items-center gap-3 rounded-2xl border border-default-200 bg-content1 px-4 py-3 transition-shadow hover:shadow-sm"
              >
                {/* Color picker to change tag color */}
                <ColorPicker
                  value={tag.color}
                  onChange={(color) => updateTag(tag.id, { color })}
                />

                {/* Tag badge preview */}
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  style={{ backgroundColor: tag.color + "22", color: tag.color }}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {editingId === tag.id ? (
                    <input
                      autoFocus
                      className="w-24 bg-transparent text-xs outline-none"
                      maxLength={32}
                      style={{ color: tag.color }}
                      value={editDraft}
                      onBlur={() => commitEdit(tag.id)}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(tag.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                  ) : (
                    <span>{tag.name}</span>
                  )}
                </span>

                {/* Actions */}
                <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    aria-label={`Rename ${tag.name}`}
                    className="rounded-lg p-1.5 text-xs text-default-400 transition-colors hover:bg-default-100 hover:text-primary"
                    type="button"
                    onClick={() => startEdit(tag)}
                  >
                    ✎
                  </button>
                  <button
                    aria-label={`Delete ${tag.name}`}
                    className="rounded-lg p-1.5 text-xs text-default-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                    type="button"
                    onClick={() => deleteTag(tag.id)}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
