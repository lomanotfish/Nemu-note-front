import type { Tag } from "@/store/use-tag-store";

type Props = {
  tag: Tag;
  onRemove?: () => void;
};

export function TagBadge({ tag, onRemove }: Props) {
  return (
    <span
      className="group/badge inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-tight"
      style={{ backgroundColor: tag.color + "22", color: tag.color }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
      {tag.name}
      {onRemove && (
        <button
          aria-label={`Remove ${tag.name} tag`}
          className="ml-0.5 leading-none opacity-0 transition-opacity group-hover/badge:opacity-100 hover:opacity-100"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
