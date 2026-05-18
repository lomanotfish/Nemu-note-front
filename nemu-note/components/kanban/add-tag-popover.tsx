"use client";

import { useRef, useState } from "react";
import { useTagStore } from "@/store/use-tag-store";

type Props = {
  selectedTagIds: string[];
  onToggle: (tagId: string) => void;
};

export function AddTagPopover({ selectedTagIds, onToggle }: Props) {
  const tags = useTagStore((s) => s.tags);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  function close() {
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        aria-label="Add tag"
        className="rounded-md px-1.5 py-0.5 text-xs text-default-400 transition-colors hover:bg-default-100 hover:text-default-600"
        type="button"
        onClick={() => setOpen((o) => !o)}
      >
        + tag
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute left-0 top-6 z-50 w-52 rounded-xl border border-default-200 bg-content1 p-2 shadow-xl">
            <input
              autoFocus
              className="mb-2 w-full rounded-lg border border-default-200 bg-default-100 px-2 py-1.5 text-xs outline-none transition focus:border-primary-400 focus:bg-content1"
              placeholder="Search tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-44 space-y-0.5 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-3 text-center text-xs text-default-400">No tags found</p>
              ) : (
                filtered.map((tag) => {
                  const selected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-default-100 ${selected ? "bg-default-50" : ""}`}
                      type="button"
                      onClick={() => onToggle(tag.id)}
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="flex-1">{tag.name}</span>
                      <span
                        className={`text-primary transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            {tags.length === 0 && (
              <p className="mt-1 border-t border-default-100 pt-2 text-center text-xs text-default-400">
                Create tags in Settings → Tags
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
