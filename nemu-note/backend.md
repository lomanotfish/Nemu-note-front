# Nemu Note — Backend Documentation

## ภาพรวม

แอปพลิเคชันมี 2 feature หลัก:

- **Note** — sticky notes ส่วนตัว (title + content)
- **Kanban Board** — board ที่มี columns → tasks พร้อม drag-and-drop และ tag

ทั้งสองฟีเจอร์ใช้ **Tags** ร่วมกัน และทุกข้อมูล scope ตาม **User** ที่ login ด้วย Google OAuth

---

## Database Design (MongoDB)

### Relationship Overview

```
users (1)
  ├──< notes  (N)        userId ref
  ├──< tags   (N)        userId ref
  └──< boards (N)        userId ref
        └── columns[]    embedded
              └── tasks[] embedded
                    └── tagIds[] → tags._id
```

### การตัดสินใจสำคัญ

| ประเด็น | การตัดสินใจ | เหตุผล |
|---|---|---|
| columns + tasks | Embed ใน board | Read/write พร้อมกันทุกครั้ง, atomic update ทั้ง board |
| tags | แยก collection | ใช้ร่วมกันข้าม task หลายตัว, แก้ชื่อ/สีที่เดียว propagate ทันที |
| หลาย board ต่อ user | รองรับด้วย field `name` | โค้ดมี `createBoard` — ควรรองรับไว้ตั้งแต่ต้น |
| `order` field | Number | reorder ง่ายกว่าการอิง array index เมื่อ drag-and-drop |
| tagIds ใน task | `ObjectId[]` | ไม่ต้อง update task ทุกตัวเมื่อ tag เปลี่ยนชื่อ/สี |

---

### Collections

#### 1. `users`

เก็บข้อมูล user ที่ login ผ่าน Google OAuth

```js
{
  _id:        ObjectId,
  email:      String,          // unique — ใช้ lookup จาก NextAuth session
  name:       String,
  image:      String,          // Google avatar URL
  provider:   "google",
  providerId: String,          // Google sub (ป้องกัน duplicate ถ้า email เปลี่ยน)
  createdAt:  ISODate,
  updatedAt:  ISODate
}
```

**Indexes:**
- `{ email: 1 }` unique
- `{ provider: 1, providerId: 1 }` unique

---

#### 2. `notes`

บันทึกส่วนตัวของ user

```js
{
  _id:       ObjectId,
  userId:    ObjectId,         // ref → users
  title:     String,           // required
  content:   String,           // default ""
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
- `{ userId: 1, updatedAt: -1 }` — ดึง notes เรียงจากล่าสุด

---

#### 3. `tags`

Tags ที่ user สร้างขึ้น ใช้ติด task บน Kanban

```js
{
  _id:       ObjectId,
  userId:    ObjectId,         // ref → users
  name:      String,           // required, maxlength: 32
  color:     String,           // hex string เช่น "#ef4444"
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
- `{ userId: 1 }` — ดึง tags ทั้งหมดของ user

---

#### 4. `boards`

Kanban board ที่ embed columns และ tasks ไว้ภายใน

```js
{
  _id:     ObjectId,
  userId:  ObjectId,           // ref → users
  name:    String,             // default "My Board"
  bgColor: String | null,      // background color ของ board

  columns: [
    {
      _id:     ObjectId,
      title:   String,         // required
      bgColor: String | null,  // background color ของ column header
      order:   Number,         // ลำดับ column

      tasks: [
        {
          _id:       ObjectId,
          title:     String,   // required
          tagIds:    [ObjectId], // ref → tags._id
          order:     Number,   // ลำดับ task ภายใน column
          createdAt: ISODate,
          updatedAt: ISODate
        }
      ]
    }
  ],

  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes:**
- `{ userId: 1 }` — ดึง boards ของ user

---

### Mongoose Schemas (TypeScript)

```ts
import { Schema, model, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────
const UserSchema = new Schema(
  {
    email:      { type: String, required: true, unique: true },
    name:       String,
    image:      String,
    provider:   { type: String, default: "google" },
    providerId: { type: String, required: true },
  },
  { timestamps: true },
);
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

export const User = model("User", UserSchema);

// ─── Note ────────────────────────────────────────────────
const NoteSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    title:   { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true },
);
NoteSchema.index({ userId: 1, updatedAt: -1 });

export const Note = model("Note", NoteSchema);

// ─── Tag ─────────────────────────────────────────────────
const TagSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name:   { type: String, required: true, maxlength: 32 },
    color:  { type: String, required: true },
  },
  { timestamps: true },
);
TagSchema.index({ userId: 1 });

export const Tag = model("Tag", TagSchema);

// ─── Board (embedded columns + tasks) ────────────────────
const TaskSchema = new Schema(
  {
    title:  { type: String, required: true },
    tagIds: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    order:  { type: Number, required: true },
  },
  { timestamps: true },
);

const ColumnSchema = new Schema({
  title:   { type: String, required: true },
  bgColor: String,
  order:   { type: Number, required: true },
  tasks:   [TaskSchema],
});

const BoardSchema = new Schema(
  {
    userId:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    name:    { type: String, default: "My Board" },
    bgColor: String,
    columns: [ColumnSchema],
  },
  { timestamps: true },
);
BoardSchema.index({ userId: 1 });

export const Board = model("Board", BoardSchema);
```

---

## API Design

Base URL: `/api`

Authentication: ทุก endpoint ต้องมี session จาก NextAuth (middleware ตรวจ `userId` จาก session)

---

### Auth

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/me` | คืน user profile จาก session |
| `POST` | `/api/auth/sync` | upsert user ลง DB หลัง Google login สำเร็จ |

**POST /api/auth/sync — Request Body:**
```json
{
  "email": "user@gmail.com",
  "name": "Witchakorn",
  "image": "https://...",
  "providerId": "1234567890"
}
```

**Response:**
```json
{
  "_id": "...",
  "email": "user@gmail.com",
  "name": "Witchakorn",
  "image": "https://...",
  "createdAt": "2026-05-19T00:00:00.000Z"
}
```

---

### Notes

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/notes` | ดึง notes ทั้งหมดของ user เรียงตาม `updatedAt DESC` |
| `POST` | `/api/notes` | สร้าง note ใหม่ |
| `PATCH` | `/api/notes/:id` | แก้ไข title และ/หรือ content |
| `DELETE` | `/api/notes/:id` | ลบ note |

**GET /api/notes — Response:**
```json
[
  {
    "_id": "...",
    "title": "Meeting notes",
    "content": "เนื้อหา...",
    "createdAt": "2026-05-19T10:00:00.000Z",
    "updatedAt": "2026-05-19T10:30:00.000Z"
  }
]
```

**POST /api/notes — Request Body:**
```json
{
  "title": "Meeting notes",
  "content": "เนื้อหา..."
}
```

**PATCH /api/notes/:id — Request Body** (fields ที่ต้องการแก้เท่านั้น):
```json
{
  "title": "Updated title",
  "content": "Updated content"
}
```

---

### Tags

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tags` | ดึง tags ทั้งหมดของ user |
| `POST` | `/api/tags` | สร้าง tag ใหม่ |
| `PATCH` | `/api/tags/:id` | แก้ไข name และ/หรือ color |
| `DELETE` | `/api/tags/:id` | ลบ tag (ควร unset tagId ออกจาก tasks ด้วย) |

**POST /api/tags — Request Body:**
```json
{
  "name": "Bug",
  "color": "#ef4444"
}
```

**PATCH /api/tags/:id — Request Body:**
```json
{
  "name": "Bug Fix",
  "color": "#dc2626"
}
```

> **หมายเหตุ:** เมื่อ `DELETE /api/tags/:id` ควรรัน
> `Board.updateMany({ userId }, { $pull: { "columns.$[].tasks.$[].tagIds": tagId } })`
> เพื่อเอา tagId ออกจาก tasks ทุกตัวใน boards ของ user

---

### Boards

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/boards` | ดึง boards ทั้งหมดของ user (populate tagIds) |
| `GET` | `/api/boards/:id` | ดึง board เดียว (populate tagIds) |
| `POST` | `/api/boards` | สร้าง board ใหม่ |
| `PATCH` | `/api/boards/:id` | แก้ไข `name` หรือ `bgColor` ของ board |
| `DELETE` | `/api/boards/:id` | ลบ board |

**POST /api/boards — Request Body:**
```json
{
  "name": "Sprint 1",
  "bgColor": null
}
```

**PATCH /api/boards/:id — Request Body:**
```json
{
  "bgColor": "#f0f4ff"
}
```

---

### Columns

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/boards/:boardId/columns` | เพิ่ม column ใหม่ |
| `PATCH` | `/api/boards/:boardId/columns/:colId` | แก้ไข title หรือ bgColor |
| `DELETE` | `/api/boards/:boardId/columns/:colId` | ลบ column พร้อม tasks ทั้งหมด |
| `PATCH` | `/api/boards/:boardId/columns/reorder` | เรียงลำดับ columns ใหม่ |

**POST /api/boards/:boardId/columns — Request Body:**
```json
{
  "title": "In Progress",
  "bgColor": null
}
```

**PATCH /api/boards/:boardId/columns/:colId — Request Body:**
```json
{
  "title": "Doing",
  "bgColor": "#fef9c3"
}
```

**PATCH /api/boards/:boardId/columns/reorder — Request Body:**

ส่ง array ของ `colId` ตามลำดับใหม่:
```json
{
  "orderedIds": ["col-3", "col-1", "col-2"]
}
```

---

### Tasks

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/boards/:boardId/columns/:colId/tasks` | เพิ่ม task ใหม่ |
| `PATCH` | `/api/boards/:boardId/tasks/:taskId` | แก้ไข title หรือ tagIds |
| `DELETE` | `/api/boards/:boardId/tasks/:taskId` | ลบ task |
| `PATCH` | `/api/boards/:boardId/tasks/:taskId/move` | ย้าย task ข้าม column หรือ reorder |

**POST /api/boards/:boardId/columns/:colId/tasks — Request Body:**
```json
{
  "title": "Research competitors",
  "tagIds": ["tag-id-1"]
}
```

**PATCH /api/boards/:boardId/tasks/:taskId — Request Body:**
```json
{
  "title": "Research competitors (updated)",
  "tagIds": ["tag-id-1", "tag-id-2"]
}
```

**PATCH /api/boards/:boardId/tasks/:taskId/move — Request Body:**
```json
{
  "fromColId": "col-1",
  "toColId":   "col-2",
  "newOrder":  1
}
```

---

## Error Response Format

ทุก API ควรคืน error ในรูปแบบเดียวกัน:

```json
{
  "error": "Note not found",
  "code":  "NOT_FOUND"
}
```

| HTTP Status | ความหมาย |
|---|---|
| `200` | สำเร็จ |
| `201` | สร้างสำเร็จ |
| `400` | Request body ไม่ถูกต้อง |
| `401` | ไม่มี session / token หมดอายุ |
| `403` | resource ไม่ใช่ของ user คนนี้ |
| `404` | ไม่พบ resource |
| `500` | Server error |

---

## Environment Variables ที่ต้องการ

```env
# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nemu-note
```
