export type Task = {
  id: string;
  title: string;
};

export type Column = {
  id: string;
  title: string;
  tasks: Task[];
  bgColor?: string;
};

export type Board = {
  columns: Column[];
};

export const DragType = {
  Task: "task",
  Column: "column",
} as const;

export type DragTypeValue = (typeof DragType)[keyof typeof DragType];

export type TaskDragData = { type: typeof DragType.Task; task: Task };
export type ColumnDragData = { type: typeof DragType.Column };
