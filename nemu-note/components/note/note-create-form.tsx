"use client";

import { useState } from "react";
import { Button, Card, InputGroup, TextField } from "@heroui/react";

type Props = {
  onCreate: (title: string, content: string) => void;
};

export function NoteCreateForm({ onCreate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function submit() {
    const t = title.trim();
    if (!t) return;
    onCreate(t, content.trim());
    setTitle("");
    setContent("");
    setExpanded(false);
  }

  function cancel() {
    setTitle("");
    setContent("");
    setExpanded(false);
  }

  if (!expanded) {
    return (
      <button
        className="flex w-full cursor-text items-center gap-3 rounded-xl border border-default-200 bg-content1 px-5 py-3.5 text-left text-sm text-default-400 shadow-sm transition-all hover:border-primary-300 hover:shadow-md"
        type="button"
        onClick={() => setExpanded(true)}
      >
        <span className="text-lg font-light">+</span>
        <span>สร้างบันทึกใหม่...</span>
      </button>
    );
  }

  return (
    <Card className="border border-primary-300 shadow-md">
      <Card.Content className="flex flex-col gap-3 p-4">
        <TextField aria-label="หัวข้อ" value={title} onChange={setTitle}>
          <InputGroup variant="secondary">
            <InputGroup.Input
              autoFocus
              className="text-base font-semibold"
              placeholder="หัวข้อ"
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
                if (e.key === "Enter") {
                  e.preventDefault();
                  document.getElementById("note-content-area")?.focus();
                }
              }}
            />
          </InputGroup>
        </TextField>

        <TextField aria-label="เนื้อหา" value={content} onChange={setContent}>
          <InputGroup variant="secondary">
            <InputGroup.TextArea
              id="note-content-area"
              className="min-h-24"
              placeholder="เขียนบันทึก..."
              onKeyDown={(e) => {
                if (e.key === "Escape") cancel();
              }}
            />
          </InputGroup>
        </TextField>

        <div className="flex justify-end gap-2 border-t border-default-100 pt-2">
          <Button size="sm" variant="secondary" onPress={cancel}>
            ยกเลิก
          </Button>
          <Button isDisabled={!title.trim()} size="sm" onPress={submit}>
            สร้าง
          </Button>
        </div>
      </Card.Content>
    </Card>
  );
}
