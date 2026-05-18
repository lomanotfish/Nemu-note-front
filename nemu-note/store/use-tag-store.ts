import { create } from "zustand";
import { api } from "@/lib/api";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagStore = {
  tags: Tag[];
  isLoading: boolean;
  fetchTags: () => Promise<void>;
  createTag: (name: string, color: string) => Promise<void>;
  updateTag: (id: string, updates: Partial<Pick<Tag, "name" | "color">>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
};

function fromApi(t: Record<string, string>): Tag {
  return { id: t._id, name: t.name, color: t.color };
}

async function loadTags(): Promise<Tag[]> {
  const data = await api.get<Record<string, string>[]>("/tags");
  return data.map(fromApi);
}

export const useTagStore = create<TagStore>((set) => ({
  tags:      [],
  isLoading: false,

  fetchTags: async () => {
    set({ isLoading: true });
    try {
      set({ tags: await loadTags() });
    } catch (err) {
      console.error("[Tags] fetch failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createTag: async (name, color) => {
    await api.post("/tags", { name, color });
    set({ tags: await loadTags() });
  },

  updateTag: async (id, updates) => {
    await api.patch(`/tags/${id}`, updates);
    set({ tags: await loadTags() });
  },

  deleteTag: async (id) => {
    await api.delete(`/tags/${id}`);
    set({ tags: await loadTags() });
  },
}));
