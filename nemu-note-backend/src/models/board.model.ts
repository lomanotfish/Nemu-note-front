import { Schema, model, Types } from "mongoose";

const taskSchema = new Schema(
  {
    title:  { type: String, required: true },
    tagIds: [{ type: Types.ObjectId, ref: "Tag" }],
    order:  { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const columnSchema = new Schema({
  title:   { type: String, required: true },
  bgColor: { type: String },
  order:   { type: Number, required: true, default: 0 },
  tasks:   [taskSchema],
});

const boardSchema = new Schema(
  {
    userId:  { type: Types.ObjectId, ref: "User", required: true },
    name:    { type: String, default: "My Board" },
    bgColor: { type: String },
    columns: [columnSchema],
  },
  { timestamps: true },
);

boardSchema.index({ userId: 1 });

export const Board = model("Board", boardSchema);
