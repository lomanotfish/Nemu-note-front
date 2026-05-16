import type { Board } from "./types";

export const MOCK_BOARD: Board = {
  columns: [
    {
      id: "col-1",
      title: "To Do",
      tasks: [
        { id: "task-1", title: "Research competitors" },
        { id: "task-2", title: "Write project brief" },
        { id: "task-3", title: "Schedule kickoff meeting" },
      ],
    },
    {
      id: "col-2",
      title: "In Progress",
      tasks: [
        { id: "task-4", title: "Design wireframes" },
        { id: "task-5", title: "Set up project repo" },
      ],
    },
    {
      id: "col-3",
      title: "Done",
      tasks: [{ id: "task-6", title: "Define project scope" }],
    },
  ],
};
