"use client";

import { useEffect } from "react";
import { EmptyState } from "@heroui/react";

import { useNoteStore } from "@/store/use-note-store";

import { NoteCard } from "./note/note-card";
import { NoteCreateForm } from "./note/note-create-form";

export default function Note() {
  const { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote } = useNoteStore();

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="flex w-full flex-col gap-6">
      <NoteCreateForm onCreate={createNote} />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <p className="text-default-400 text-sm">กำลังโหลด…</p>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState className="flex flex-col items-center gap-3 py-20">
          <p className="text-5xl">📝</p>
          <p className="text-default-500">ยังไม่มีบันทึก สร้างบันทึกแรกของคุณ!</p>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={deleteNote}
              onUpdate={updateNote}
            />
          ))}
        </div>
      )}
    </div>
  );
}
