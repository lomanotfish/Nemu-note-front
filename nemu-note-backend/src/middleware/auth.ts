import Elysia from "elysia";
import { bearer } from "@elysiajs/bearer";
import { User } from "@/models/user.model";

// Simple in-memory cache: googleToken → { userId, expiresAt }
// ป้องกัน Google API call ซ้ำในทุก request (TTL 5 นาที)
const tokenCache = new Map<string, { userId: string; expiresAt: number }>();

async function resolveUserId(googleToken: string): Promise<string | null> {
  const cached = tokenCache.get(googleToken);
  if (cached && cached.expiresAt > Date.now()) return cached.userId;

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${googleToken}` },
  });

  if (!res.ok) return null;

  const { sub } = (await res.json()) as { sub: string };

  const user = await User.findOne({ provider: "google", providerId: sub }).select("_id");
  if (!user) return null;

  const userId = user._id.toString();
  tokenCache.set(googleToken, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });

  return userId;
}

export const authPlugin = new Elysia({ name: "auth" })
  .use(bearer())
  .derive({ as: "scoped" }, async ({ bearer, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const userId = await resolveUserId(bearer);
    if (!userId) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { userId };
  });
