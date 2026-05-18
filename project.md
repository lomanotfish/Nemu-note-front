# Nemu Note — Project Overview

เอกสารนี้สรุปภาพรวมทั้งหมดของ project สำหรับ AI agent หรือ developer ที่เข้ามาทำงานใหม่

---

## โครงสร้าง Repository

```
Nemu-note-front/
├── Nemu-note/              ← Frontend (Next.js 15)
└── nemu-note-backend/      ← Backend (Elysia + Bun)
```

---

## 1. Frontend — `Nemu-note/`

### Tech Stack

| เทคโนโลยี | รายละเอียด |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI Library | HeroUI (component library) |
| Auth | NextAuth v5 (Google OAuth) |
| State | Zustand |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Styling | Tailwind CSS |

### Pages & Routes

```
/login               ← Google Sign-in (public)
/                    ← Home: Note + Kanban switcher (protected)
/settings            ← Tags management (protected)
```

### Component Architecture

```
app/(auth)/login/page.tsx        ← Google sign-in button
app/(main)/layout.tsx            ← Navbar + Sidebar wrapper
app/(main)/page.tsx              ← renders <SwitchNote />
app/(main)/settings/page.tsx     ← renders <TagsManagement />

components/
  switch-note.tsx                ← Tab switcher: Note | Kanban Board
  note.tsx                       ← Note grid + empty state
  note/
    note-card.tsx                ← Card + inline edit modal (title, content)
    note-create-form.tsx         ← Expandable create form
  kanban-board.tsx               ← DnD context, toolbar (board bg color)
  kanban/
    kanban-column.tsx            ← Column header, task list
    task-card.tsx                ← Draggable task card + tag badges
    add-tag-popover.tsx          ← Tag selector popover
    inline-add-form.tsx          ← Inline input for column/task creation
    use-kanban-board.ts          ← All board state logic (hooks)
    types.ts                     ← Task, Column, Board, DragType
    mock-data.ts                 ← Default board (used until API connected)
  settings/
    tags-management.tsx          ← Create, rename, recolor, delete tags
  navbar.tsx                     ← App title, username, logout, theme switch
  sidebar.tsx                    ← Vertical nav: Home | Settings
  auth-sync.tsx                  ← Syncs NextAuth session → Zustand store
```

### State Stores (Zustand)

| Store | ไฟล์ | สิ่งที่เก็บ |
|---|---|---|
| `useAuthStore` | `store/use-auth-store.ts` | user (name, email, image, accessToken) |
| `useNoteStore` | `store/use-note-store.ts` | notes[], CRUD actions |
| `useTagStore` | `store/use-tag-store.ts` | tags[], CRUD actions |

> **สถานะปัจจุบัน**: stores ทั้งหมดทำงานใน memory เท่านั้น ยังไม่ได้เชื่อมกับ backend API

### Authentication Flow (Frontend)

```
User → /login → signIn("google")
  → NextAuth callback → เก็บ Google access_token ใน session (JWT)
  → redirect → /
  → <AuthSync /> component อ่าน session แล้ว setUser ลง Zustand
  → ควร call POST /api/users/sync เพื่อ upsert user ใน MongoDB ด้วย
```

### Next.js Middleware / API Proxy (`proxy.ts`)

ไฟล์นี้ทำหน้าที่เป็น **reverse proxy** — ทุก request ที่ขึ้นต้นด้วย `/api/*`
(ยกเว้น `/api/auth/*` ซึ่งเป็น NextAuth เอง) จะถูก rewrite ไปที่ backend โดยอัตโนมัติ
พร้อมแนบ Google access_token จาก session เป็น `Authorization: Bearer <token>`

```
Frontend request: GET /api/notes
  → Next.js middleware ดัก
  → เพิ่ม Authorization: Bearer <google_access_token>
  → rewrite → http://localhost:4000/api/notes
  → Backend ตรวจ token กับ Google และ query MongoDB
```

**Environment variable ที่ต้องเพิ่มใน frontend:**
```env
BACKEND_URL=http://localhost:4000
```

---

## 2. Backend — `nemu-note-backend/`

### Tech Stack

| เทคโนโลยี | รายละเอียด |
|---|---|
| Runtime | Bun |
| Framework | Elysia v1.4 |
| Database | MongoDB (via Mongoose 8) |
| Auth | Google OAuth token verification (ผ่าน Google userinfo API) |

### โครงสร้างไฟล์

```
src/
├── index.ts              ← Entry point, CORS, error handler, route groups
├── db.ts                 ← MongoDB connection (singleton)
├── middleware/
│   └── auth.ts           ← Google token verify → userId (cache 5 นาที)
├── models/
│   ├── user.model.ts     ← users collection
│   ├── note.model.ts     ← notes collection
│   ├── tag.model.ts      ← tags collection
│   └── board.model.ts    ← boards collection (columns + tasks embedded)
└── routes/
    ├── auth.route.ts     ← /api/users/sync, /api/users/me
    ├── note.route.ts     ← /api/notes  (CRUD)
    ├── tag.route.ts      ← /api/tags   (CRUD + cascade delete)
    └── board.route.ts    ← /api/boards (CRUD + columns + tasks + reorder)
```

### Authentication Flow (Backend)

Backend ไม่ออก JWT เอง ทุก request รับ Google access_token จาก frontend proxy แล้วตรวจกับ Google:

```
Request → Authorization: Bearer <google_access_token>
  → authPlugin ตรวจ in-memory cache (TTL 5 นาที)
  → ถ้าไม่มีใน cache → call GET https://www.googleapis.com/oauth2/v3/userinfo
  → ได้ providerId (sub) → query User จาก MongoDB
  → inject userId เข้า Elysia context
  → route handler ใช้ userId ได้เลย
```

### Environment Variables (`.env`)

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...        # ยังไม่ได้ใช้ในระบบปัจจุบัน (สำรองไว้)
PORT=4000
```

---

## 3. Database Design (MongoDB)

### Collections

#### `users`
```js
{
  email:      String,   // unique
  name:       String,
  image:      String,   // Google avatar URL
  provider:   "google",
  providerId: String,   // Google sub — unique ร่วมกับ provider
  createdAt, updatedAt
}
```
Index: `{ email: 1 }` unique, `{ provider: 1, providerId: 1 }` unique

#### `notes`
```js
{
  userId:  ObjectId,  // ref → users
  title:   String,
  content: String,
  createdAt, updatedAt
}
```
Index: `{ userId: 1, updatedAt: -1 }`

#### `tags`
```js
{
  userId: ObjectId,   // ref → users
  name:   String,     // maxlength 32
  color:  String,     // hex "#rrggbb"
  createdAt, updatedAt
}
```
Index: `{ userId: 1 }`

#### `boards` (columns + tasks embedded)
```js
{
  userId:  ObjectId,
  name:    String,
  bgColor: String | null,
  columns: [{
    title:   String,
    bgColor: String | null,
    order:   Number,
    tasks: [{
      title:     String,
      tagIds:    [ObjectId],  // ref → tags
      order:     Number,
      createdAt, updatedAt
    }]
  }],
  createdAt, updatedAt
}
```
Index: `{ userId: 1 }`

### Relationship

```
users (1)
  ├──< notes  (N)     userId ref
  ├──< tags   (N)     userId ref
  └──< boards (N)     userId ref
        └── columns[] embedded
              └── tasks[] embedded
                    └── tagIds[] → tags._id
```

---

## 4. API Endpoints

Base URL (จากมุม frontend): `/api/*` → proxy → `http://localhost:4000/api/*`

### Users
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/users/sync` | upsert user หลัง Google login |
| `GET` | `/api/users/me` | ดึง profile ของ user ปัจจุบัน |

### Notes
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notes` | list notes (เรียง updatedAt DESC) |
| `POST` | `/api/notes` | สร้าง note |
| `PATCH` | `/api/notes/:id` | แก้ไข title/content |
| `DELETE` | `/api/notes/:id` | ลบ note |

### Tags
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tags` | list tags ของ user |
| `POST` | `/api/tags` | สร้าง tag |
| `PATCH` | `/api/tags/:id` | แก้ไข name/color |
| `DELETE` | `/api/tags/:id` | ลบ tag + cascade pull จาก tasks |

### Boards
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/boards` | list boards (populate tag info) |
| `GET` | `/api/boards/:boardId` | ดึง board เดียว |
| `POST` | `/api/boards` | สร้าง board |
| `PATCH` | `/api/boards/:boardId` | แก้ไข name/bgColor |
| `DELETE` | `/api/boards/:boardId` | ลบ board |

### Columns
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/boards/:boardId/columns` | เพิ่ม column |
| `PATCH` | `/api/boards/:boardId/columns/reorder` | เรียงลำดับ columns ใหม่ |
| `PATCH` | `/api/boards/:boardId/columns/:colId` | แก้ไข title/bgColor |
| `DELETE` | `/api/boards/:boardId/columns/:colId` | ลบ column + tasks |

### Tasks
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/boards/:boardId/columns/:colId/tasks` | เพิ่ม task |
| `PATCH` | `/api/boards/:boardId/tasks/:taskId` | แก้ไข title/tagIds |
| `DELETE` | `/api/boards/:boardId/tasks/:taskId` | ลบ task |
| `PATCH` | `/api/boards/:boardId/tasks/:taskId/move` | ย้าย task ข้าม column |

### Error Response Format
```json
{ "error": "...", "code": "NOT_FOUND | UNAUTHORIZED | VALIDATION_ERROR | INTERNAL_ERROR" }
```

---

## 5. วิธี Run

### Backend
```bash
cd nemu-note-backend
bun run dev        # hot-reload ที่ port 4000
```

### Frontend
```bash
cd Nemu-note
bun run dev        # port 3000
```

> ต้องรัน backend ก่อน แล้วค่อยรัน frontend

---

## 6. สิ่งที่ยังไม่ได้ทำ (Next Steps)

| งาน | รายละเอียด |
|---|---|
| เพิ่ม `BACKEND_URL` ใน `.env.local` | Frontend ต้องรู้ว่า backend อยู่ที่ไหน |
| เชื่อม `useNoteStore` กับ API | แทน mock data ด้วย `fetch /api/notes` |
| เชื่อม `useTagStore` กับ API | แทน MOCK_TAGS ด้วย `fetch /api/tags` |
| เชื่อม `useKanbanBoard` กับ API | แทน MOCK_BOARD ด้วย `fetch /api/boards` |
| เรียก `POST /api/users/sync` ใน `auth-sync.tsx` | ให้ user ถูก upsert ลง DB หลัง login |
| เพิ่ม rate limiting บน `/api/users/sync` | ป้องกัน abuse |
| Invalidate token cache เมื่อ token หมดอายุ | Google token อายุ ~1 ชั่วโมง |
