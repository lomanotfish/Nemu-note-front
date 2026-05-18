import Elysia, { t } from "elysia";
import { Types } from "mongoose";
import { authPlugin } from "@/middleware/auth";
import { Tag } from "@/models/tag.model";
import { Board } from "@/models/board.model";

export const tagRoute = new Elysia({ prefix: "/tags" })
  .use(authPlugin)

  // GET /api/tags
  .get("/", async ({ userId }) => {
    return Tag.find({ userId }).select("-__v").lean();
  })

  // POST /api/tags
  .post(
    "/",
    async ({ userId, body, set }) => {
      const tag = await Tag.create({ userId, ...body });
      set.status = 201;
      return tag;
    },
    {
      body: t.Object({
        name:  t.String({ minLength: 1, maxLength: 32 }),
        color: t.String({ pattern: "^#[0-9a-fA-F]{6}$" }),
      }),
    },
  )

  // PATCH /api/tags/:id
  .patch(
    "/:id",
    async ({ userId, params, body, set }) => {
      if (!Types.ObjectId.isValid(params.id)) {
        set.status = 400;
        return { error: "Invalid ID", code: "INVALID_ID" };
      }

      const tag = await Tag.findOneAndUpdate(
        { _id: params.id, userId },
        { $set: body },
        { new: true },
      ).select("-__v");

      if (!tag) {
        set.status = 404;
        return { error: "Tag not found", code: "NOT_FOUND" };
      }

      return tag;
    },
    {
      body: t.Object({
        name:  t.Optional(t.String({ minLength: 1, maxLength: 32 })),
        color: t.Optional(t.String({ pattern: "^#[0-9a-fA-F]{6}$" })),
      }),
    },
  )

  // DELETE /api/tags/:id
  // ลบ tag แล้ว pull tagId ออกจาก tasks ทุกตัวในทุก board ของ user
  .delete("/:id", async ({ userId, params, set }) => {
    if (!Types.ObjectId.isValid(params.id)) {
      set.status = 400;
      return { error: "Invalid ID", code: "INVALID_ID" };
    }

    const tag = await Tag.findOneAndDelete({ _id: params.id, userId });
    if (!tag) {
      set.status = 404;
      return { error: "Tag not found", code: "NOT_FOUND" };
    }

    // Remove tagId from all tasks across all boards of this user
    await Board.updateMany(
      { userId },
      { $pull: { "columns.$[].tasks.$[].tagIds": tag._id } },
    );

    return { success: true };
  });
