"use client";

import { useState } from "react";
import {
  Button,
  Card,
  InputGroup,
  Modal,
  Separator,
  TextField,
} from "@heroui/react";

import type { Note } from "@/store/use-note-store";

type Props = {
  note: Note;
  onUpdate: (id: string, updates: Partial<Pick<Note, "title" | "content">>) => void;
  onDelete: (id: string) => void;
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function NoteCard({ note, onUpdate, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content);

  const hasChanges =
    draftTitle.trim() !== note.title || draftContent.trim() !== note.content;

  function openModal() {
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setOpen(true);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setDraftTitle(note.title);
      setDraftContent(note.content);
    }
    setOpen(isOpen);
  }

  function saveEdit() {
    const t = draftTitle.trim();
    if (!t) return;
    onUpdate(note.id, { title: t, content: draftContent.trim() });
    setOpen(false);
  }

  function revert() {
    setDraftTitle(note.title);
    setDraftContent(note.content);
  }

  function handleDelete() {
    onDelete(note.id);
    setOpen(false);
  }

  return (
    <>
      <Card
        className="min-h-32 cursor-pointer transition-shadow hover:shadow-md"
        onClick={openModal}
      >
        <Card.Header>
          <Card.Title className="line-clamp-1">{note.title}</Card.Title>
        </Card.Header>

        {note.content && (
          <Card.Content>
            <Card.Description className="line-clamp-3 whitespace-pre-wrap">
              {note.content}
            </Card.Description>
          </Card.Content>
        )}

        <Card.Footer>
          <span className="text-xs text-default-400">{formatDate(note.updatedAt)}</span>
        </Card.Footer>
      </Card>

      <Modal.Root isOpen={open} onOpenChange={handleOpenChange}>
        <Modal.Backdrop isDismissable={!hasChanges} variant="blur">
          <Modal.Container placement="center" size="md">
            <Modal.Dialog>
              <Modal.Header className="flex items-start justify-between gap-2">
                <TextField
                  aria-label="หัวข้อ"
                  className="flex-1"
                  value={draftTitle}
                  onChange={setDraftTitle}
                >
                  <InputGroup variant="secondary">
                    <InputGroup.Input
                      className="text-lg font-semibold"
                      placeholder="หัวข้อ"
                    />
                  </InputGroup>
                </TextField>
                <Modal.CloseTrigger />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-3">
                <TextField
                  aria-label="เนื้อหา"
                  value={draftContent}
                  onChange={setDraftContent}
                >
                  <InputGroup variant="secondary">
                    <InputGroup.TextArea
                      className="min-h-40"
                      placeholder="เขียนบันทึกของคุณ..."
                    />
                  </InputGroup>
                </TextField>

                <p className="text-xs text-default-400">
                  แก้ไขล่าสุด: {formatDate(note.updatedAt)}
                </p>
              </Modal.Body>

              <Separator />

              <Modal.Footer className="flex items-center justify-between">
                <Button variant="danger-soft" onPress={handleDelete}>
                  ลบบันทึก
                </Button>

                {hasChanges && (
                  <div className="flex gap-2">
                    <Button variant="ghost" onPress={revert}>
                      ยกเลิก
                    </Button>
                    <Button isDisabled={!draftTitle.trim()} onPress={saveEdit}>
                      บันทึก
                    </Button>
                  </div>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </>
  );
}
