import Elysia from "elysia";
import { cors } from "@elysiajs/cors";
import { connectDB } from "@/db";
import { authRoute } from "@/routes/auth.route";
import { noteRoute } from "@/routes/note.route";
import { tagRoute } from "@/routes/tag.route";
import { boardRoute } from "@/routes/board.route";

const apiPlugin = new Elysia({ prefix: "/api" })
  .use(authRoute)   // /api/users/sync, /api/users/me
  .use(noteRoute)   // /api/notes
  .use(tagRoute)    // /api/tags
  .use(boardRoute); // /api/boards

const app = new Elysia()
  .onStart(async () => { await connectDB(); })
  .use(
    cors({
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )

  // Global error handler
  .onError(({ error, set, code }) => {
    if ((error as Error).message === "Unauthorized") {
      set.status = 401;
      return { error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation error", code: "VALIDATION_ERROR", detail: error.message };
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found", code: "NOT_FOUND" };
    }
    console.error("[Error]", error);
    set.status = 500;
    return { error: "Internal server error", code: "INTERNAL_ERROR" };
  })

  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(apiPlugin)

  .listen(Number(Bun.env.PORT ?? 4000));

console.log(`[Server] Running at http://localhost:${app.server?.port}`);
