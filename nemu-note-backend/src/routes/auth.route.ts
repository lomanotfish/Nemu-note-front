import Elysia from "elysia";
import { User } from "@/models/user.model";

async function syncHandler(bearer: string | undefined, set: any) {
  if (!bearer) {
    set.status = 401;
    return { error: "Missing token", code: "MISSING_TOKEN" };
  }

  const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${bearer}` },
  });

  if (!googleRes.ok) {
    set.status = 401;
    return { error: "Invalid Google token", code: "INVALID_TOKEN" };
  }

  const g = (await googleRes.json()) as {
    sub: string; email: string; name: string; picture: string;
  };

  const user = await User.findOneAndUpdate(
    { provider: "google", providerId: g.sub },
    { $set: { email: g.email, name: g.name, image: g.picture, provider: "google", providerId: g.sub } },
    { upsert: true, new: true },
  );

  return {
    user: { _id: user._id, email: user.email, name: user.name, image: user.image, createdAt: user.createdAt },
  };
}

async function meHandler(bearer: string | undefined, set: any) {
  if (!bearer) {
    set.status = 401;
    return { error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${bearer}` },
  });

  if (!googleRes.ok) {
    set.status = 401;
    return { error: "Invalid token", code: "INVALID_TOKEN" };
  }

  const { sub } = (await googleRes.json()) as { sub: string };
  const user = await User.findOne({ provider: "google", providerId: sub }).select("-__v");

  if (!user) {
    set.status = 404;
    return { error: "User not found", code: "NOT_FOUND" };
  }

  return user;
}

// ใช้ Elysia plugin (ไม่มี prefix) เพื่อให้ group ใน index.ts นำ prefix "/api" มาใส่
export const authRoute = new Elysia({ name: "auth-route", prefix: "/users" })
  .post("/sync", ({ request, set }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "") || undefined;
    return syncHandler(token, set);
  })
  .get("/me", ({ request, set }) => {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "") || undefined;
    return meHandler(token, set);
  });
