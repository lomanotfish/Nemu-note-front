import { create } from "zustand";
import { api } from "@/lib/api";

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

type NoteStore = {
  notes: Note[];
  isLoading: boolean;
  fetchNotes: () => Promise<void>;
  createNote: (title: string, content: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Pick<Note, "title" | "content">>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
};

function fromApi(n: Record<string, string>): Note {
  return {
    id:        n._id,
    title:     n.title,
    content:   n.content,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

async function loadNotes(): Promise<Note[]> {
  const data = await api.get<Record<string, string>[]>("/notes");
  return data.map(fromApi);
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes:     [],
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true });
    try {
      set({ notes: await loadNotes() });
    } catch (err) {
      console.error("[Notes] fetch failed:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  createNote: async (title, content) => {
    await api.post("/notes", { title, content });
    set({ notes: await loadNotes() });
  },

  updateNote: async (id, updates) => {
    await api.patch(`/notes/${id}`, updates);
    set({ notes: await loadNotes() });
  },

  deleteNote: async (id) => {
    await api.delete(`/notes/${id}`);
    set({ notes: await loadNotes() });
  },
}));
