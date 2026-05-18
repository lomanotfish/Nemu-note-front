import Elysia, { t } from "elysia";
import { Types } from "mongoose";
import { authPlugin } from "@/middleware/auth";
import { Board } from "@/models/board.model";

// ─── helpers ─────────────────────────────────────────────────────────────────

function normalizeOrder<T extends { order: number }>(items: T[]) {
  items.forEach((item, i) => {
    item.order = i;
  });
}

function isValidId(id: string) {
  return Types.ObjectId.isValid(id);
}

// ─── route ───────────────────────────────────────────────────────────────────

export const boardRoute = new Elysia({ prefix: "/boards" })
  .use(authPlugin)

  // ── Board CRUD ──────────────────────────────────────────────────────────────

  // GET /api/boards
  .get("/", async ({ userId }) => {
    return Board.find({ userId })
      .populate("columns.tasks.tagIds", "name color")
      .select("-__v")
      .lean();
  })

  // GET /api/boards/:boardId
  .get("/:boardId", async ({ userId, params, set }) => {
    if (!isValidId(params.boardId)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const board = await Board.findOne({ _id: params.boardId, userId })
      .populate("columns.tasks.tagIds", "name color")
      .select("-__v")
      .lean();

    if (!board) {
      set.status = 404;
      return { error: "Board not found", code: "NOT_FOUND" };
    }

    return board;
  })

  // POST /api/boards
  .post(
    "/",
    async ({ userId, body, set }) => {
      const board = await Board.create({ userId, ...body });
      set.status = 201;
      return board;
    },
    {
      body: t.Object({
        name:    t.Optional(t.String({ minLength: 1 })),
        bgColor: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // PATCH /api/boards/:boardId
  .patch(
    "/:boardId",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOneAndUpdate(
        { _id: params.boardId, userId },
        { $set: body },
        { new: true },
      ).select("-__v");

      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      return board;
    },
    {
      body: t.Object({
        name:    t.Optional(t.String({ minLength: 1 })),
        bgColor: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // DELETE /api/boards/:boardId
  .delete("/:boardId", async ({ userId, params, set }) => {
    if (!isValidId(params.boardId)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const board = await Board.findOneAndDelete({ _id: params.boardId, userId });
    if (!board) {
      set.status = 404;
      return { error: "Board not found", code: "NOT_FOUND" };
    }

    return { success: true };
  })

  // ── Column operations ───────────────────────────────────────────────────────

  // POST /api/boards/:boardId/columns
  .post(
    "/:boardId/columns",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      const order = board.columns.length;
      board.columns.push({ title: body.title, bgColor: body.bgColor ?? undefined, order, tasks: [] } as any);
      await board.save();

      return board;
    },
    {
      body: t.Object({
        title:   t.String({ minLength: 1 }),
        bgColor: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // PATCH /api/boards/:boardId/columns/reorder  ← ต้องมาก่อน /:colId
  .patch(
    "/:boardId/columns/reorder",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      const { orderedIds } = body;

      // เรียง columns ตาม orderedIds แล้ว re-assign order
      const colMap = new Map(board.columns.map((c) => [c._id.toString(), c]));
      const reordered = orderedIds
        .map((id: string) => colMap.get(id))
        .filter(Boolean) as (typeof board.columns)[number][];

      reordered.forEach((col, i) => {
        col.order = i;
      });

      // แทนที่ columns ด้วย array ที่เรียงใหม่
      board.columns = reordered as any;
      await board.save();

      return board;
    },
    {
      body: t.Object({
        orderedIds: t.Array(t.String()),
      }),
    },
  )

  // PATCH /api/boards/:boardId/columns/:colId
  .patch(
    "/:boardId/columns/:colId",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId) || !isValidId(params.colId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      const col = board.columns.id(params.colId);
      if (!col) {
        set.status = 404;
        return { error: "Column not found", code: "NOT_FOUND" };
      }

      if (body.title   !== undefined) col.title   = body.title;
      if (body.bgColor !== undefined) col.bgColor = body.bgColor ?? undefined;

      await board.save();
      return board;
    },
    {
      body: t.Object({
        title:   t.Optional(t.String({ minLength: 1 })),
        bgColor: t.Optional(t.Nullable(t.String())),
      }),
    },
  )

  // DELETE /api/boards/:boardId/columns/:colId
  .delete("/:boardId/columns/:colId", async ({ userId, params, set }) => {
    if (!isValidId(params.boardId) || !isValidId(params.colId)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const board = await Board.findOne({ _id: params.boardId, userId });
    if (!board) {
      set.status = 404;
      return { error: "Board not found", code: "NOT_FOUND" };
    }

    const col = board.columns.id(params.colId);
    if (!col) {
      set.status = 404;
      return { error: "Column not found", code: "NOT_FOUND" };
    }

    col.deleteOne();
    normalizeOrder(board.columns as any);
    await board.save();

    return board;
  })

  // ── Task operations ─────────────────────────────────────────────────────────

  // POST /api/boards/:boardId/columns/:colId/tasks
  .post(
    "/:boardId/columns/:colId/tasks",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId) || !isValidId(params.colId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      const col = board.columns.id(params.colId);
      if (!col) {
        set.status = 404;
        return { error: "Column not found", code: "NOT_FOUND" };
      }

      const order = col.tasks.length;
      col.tasks.push({ title: body.title, tagIds: (body.tagIds as any) ?? [], order } as any);
      await board.save();

      set.status = 201;
      return board;
    },
    {
      body: t.Object({
        title:  t.String({ minLength: 1 }),
        tagIds: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // PATCH /api/boards/:boardId/tasks/:taskId
  .patch(
    "/:boardId/tasks/:taskId",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId) || !isValidId(params.taskId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      // ค้นหา task ข้ามทุก column
      let found = false;
      for (const col of board.columns) {
        const task = col.tasks.id(params.taskId);
        if (task) {
          if (body.title  !== undefined) task.title  = body.title;
          if (body.tagIds !== undefined) (task as any).tagIds = body.tagIds;
          found = true;
          break;
        }
      }

      if (!found) {
        set.status = 404;
        return { error: "Task not found", code: "NOT_FOUND" };
      }

      await board.save();
      return board;
    },
    {
      body: t.Object({
        title:  t.Optional(t.String({ minLength: 1 })),
        tagIds: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // DELETE /api/boards/:boardId/tasks/:taskId
  .delete("/:boardId/tasks/:taskId", async ({ userId, params, set }) => {
    if (!isValidId(params.boardId) || !isValidId(params.taskId)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const board = await Board.findOne({ _id: params.boardId, userId });
    if (!board) {
      set.status = 404;
      return { error: "Board not found", code: "NOT_FOUND" };
    }

    let found = false;
    for (const col of board.columns) {
      const task = col.tasks.id(params.taskId);
      if (task) {
        task.deleteOne();
        normalizeOrder(col.tasks as any);
        found = true;
        break;
      }
    }

    if (!found) {
      set.status = 404;
      return { error: "Task not found", code: "NOT_FOUND" };
    }

    await board.save();
    return board;
  })

  // PATCH /api/boards/:boardId/tasks/:taskId/move
  .patch(
    "/:boardId/tasks/:taskId/move",
    async ({ userId, params, body, set }) => {
      if (!isValidId(params.boardId) || !isValidId(params.taskId)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const board = await Board.findOne({ _id: params.boardId, userId });
      if (!board) {
        set.status = 404;
        return { error: "Board not found", code: "NOT_FOUND" };
      }

      const { toColId, newOrder } = body;

      const toCol = board.columns.id(toColId);
      if (!toCol) {
        set.status = 404;
        return { error: "Column not found", code: "NOT_FOUND" };
      }

      // ค้นหา task และ source column โดย backend เอง (ไม่ต้อง fromColId จาก client)
      let fromCol: (typeof board.columns)[number] | null = null;
      let taskIdx = -1;
      for (const col of board.columns) {
        const idx = col.tasks.findIndex((t) => t._id.toString() === params.taskId);
        if (idx !== -1) { fromCol = col; taskIdx = idx; break; }
      }

      if (!fromCol || taskIdx === -1) {
        set.status = 404;
        return { error: "Task not found", code: "NOT_FOUND" };
      }

      const [task] = fromCol.tasks.splice(taskIdx, 1) as any;
      const insertAt = Math.min(newOrder, toCol.tasks.length);
      toCol.tasks.splice(insertAt, 0, task);

      normalizeOrder(fromCol.tasks as any);
      normalizeOrder(toCol.tasks as any);

      await board.save();
      return board;
    },
    {
      body: t.Object({
        toColId:   t.String(),
        newOrder:  t.Number({ minimum: 0 }),
      }),
    },
  );
