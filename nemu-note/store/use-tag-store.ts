import { create } from "zustand";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagStore = {
  tags: Tag[];
  createTag: (name: string, color: string) => void;
  updateTag: (id: string, updates: Partial<Pick<Tag, "name" | "color">>) => void;
  deleteTag: (id: string) => void;
  /** Reserved for future API sync — replaces the entire list. */
  _setTags: (tags: Tag[]) => void;
};

const MOCK_TAGS: Tag[] = [
  { id: "tag-1", name: "Bug", color: "#ef4444" },
  { id: "tag-2", name: "Feature", color: "#3b82f6" },
  { id: "tag-3", name: "Design", color: "#a855f7" },
  { id: "tag-4", name: "Urgent", color: "#f97316" },
];

const uid = () => crypto.randomUUID();

export const useTagStore = create<TagStore>((set) => ({
  tags: MOCK_TAGS,

  createTag: (name, color) =>
    set((s) => ({ tags: [...s.tags, { id: uid(), name, color }] })),

  updateTag: (id, updates) =>
    set((s) => ({
      tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTag: (id) => set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),

  _setTags: (tags) => set({ tags }),
}));
