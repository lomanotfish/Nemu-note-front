import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email:      { type: String, required: true, unique: true },
    name:       { type: String },
    image:      { type: String },
    provider:   { type: String, default: "google" },
    providerId: { type: String, required: true },
  },
  { timestamps: true },
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export type IUser = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
