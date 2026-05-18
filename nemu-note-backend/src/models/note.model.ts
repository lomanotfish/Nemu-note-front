import { Schema, model, Types, type InferSchemaType } from "mongoose";

const noteSchema = new Schema(
  {
    userId:  { type: Types.ObjectId, ref: "User", required: true },
    title:   { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true },
);

noteSchema.index({ userId: 1, updatedAt: -1 });

export type INote = InferSchemaType<typeof noteSchema>;
export const Note = model("Note", noteSchema);
