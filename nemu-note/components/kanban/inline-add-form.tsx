"use client";

import { useState } from "react";

type Props = {
  triggerLabel: string;
  triggerClassName?: string;
  placeholder: string;
  submitLabel?: string;
  onSubmit: (value: string) => void;
};

const DEFAULT_TRIGGER_CLASS =
  "flex w-full items-center gap-1 rounded-lg px-2 py-2 text-sm text-default-400 hover:bg-default-200 hover:text-default-600";

export function InlineAddForm({
  triggerLabel,
  triggerClassName = DEFAULT_TRIGGER_CLASS,
  placeholder,
  submitLabel = "Add",
  onSubmit,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");

  function close() {
    setValue("");
    setIsOpen(false);
  }

  function submit() {
    const v = value.trim();
    if (v) onSubmit(v);
    close();
  }

  if (!isOpen) {
    return (
      <button className={triggerClassName} type="button" onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        autoFocus
        className="w-full rounded-lg border border-default-300 bg-content1 px-3 py-2 text-sm outline-none focus:border-primary"
        placeholder={placeholder}
        value={value}
        onBlur={submit}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") close();
        }}
      />
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:opacity-90"
          type="button"
          onClick={submit}
        >
          {submitLabel}
        </button>
        <button
          className="rounded-lg px-3 py-1.5 text-xs text-default-500 hover:bg-default-200"
          type="button"
          onClick={close}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
