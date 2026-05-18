import Elysia, { t } from "elysia";
import { Types } from "mongoose";
import { authPlugin } from "@/middleware/auth";
import { Note } from "@/models/note.model";

export const noteRoute = new Elysia({ prefix: "/notes" })
  .use(authPlugin)

  // GET /api/notes
  .get("/", async ({ userId }) => {
    const notes = await Note.find({ userId })
      .sort({ updatedAt: -1 })
      .select("-__v")
      .lean();
    return notes;
  })

  // POST /api/notes
  .post(
    "/",
    async ({ userId, body, set }) => {
      const note = await Note.create({ userId, ...body });
      set.status = 201;
      return note;
    },
    {
      body: t.Object({
        title:   t.String({ minLength: 1 }),
        content: t.Optional(t.String()),
      }),
    },
  )

  // PATCH /api/notes/:id
  .patch(
    "/:id",
    async ({ userId, params, body, set }) => {
      if (!Types.ObjectId.isValid(params.id)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const note = await Note.findOneAndUpdate(
        { _id: params.id, userId },
        { $set: body },
        { new: true },
      ).select("-__v");

      if (!note) {
        set.status = 404;
        return { error: "Note not found", code: "NOT_FOUND" };
      }

      return note;
    },
    {
      body: t.Object({
        title:   t.Optional(t.String({ minLength: 1 })),
        content: t.Optional(t.String()),
      }),
    },
  )

  // DELETE /api/notes/:id
  .delete("/:id", async ({ userId, params, set }) => {
    if (!Types.ObjectId.isValid(params.id)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const note = await Note.findOneAndDelete({ _id: params.id, userId });
    if (!note) {
      set.status = 404;
      return { error: "Note not found", code: "NOT_FOUND" };
    }

    return { success: true };
  });
