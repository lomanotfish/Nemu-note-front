import { Schema, model, Types, type InferSchemaType } from "mongoose";

const tagSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    name:   { type: String, required: true, maxlength: 32 },
    color:  { type: String, required: true },
  },
  { timestamps: true },
);

tagSchema.index({ userId: 1 });

export type ITag = InferSchemaType<typeof tagSchema>;
export const Tag = model("Tag", tagSchema);
