# MongoDB Database Schema

**Database:** `task_manager` (MongoDB Atlas)
**ODM:** Mongoose

The database has two collections. Each task points to the user who owns it.

```
users (1) ────────< (many) tasks
  _id  <──────────────  user
```

## Collection: `users`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | yes | Trimmed |
| `email` | String | yes | **Unique**, stored lowercase |
| `password` | String | yes | At least 8 characters before hashing. Stored as a **bcrypt hash** (12 salt rounds). Excluded from query results by default (`select: false`) |
| `createdAt` | Date | auto | Added by `timestamps` |
| `updatedAt` | Date | auto | Added by `timestamps` |

**Indexes:** unique index on `email`.

**Example document**
```json
{
  "_id": "665f1c0a9b1e8a0012a4d111",
  "name": "Asha",
  "email": "asha@example.com",
  "password": "$2b$12$Xk3...hashed...",
  "createdAt": "2026-10-13T08:55:00.000Z",
  "updatedAt": "2026-10-13T08:55:00.000Z"
}
```

## Collection: `tasks`

| Field | Type | Required | Constraints |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `user` | ObjectId | yes | Reference to `users._id` (the owner). Indexed |
| `title` | String | yes | Trimmed, max 120 characters |
| `description` | String | no | Default empty string |
| `status` | String | no | One of `todo`, `in-progress`, `done`. Default `todo` |
| `priority` | String | no | One of `low`, `medium`, `high`. Default `medium` |
| `dueDate` | Date | no | Deadline. Default `null` |
| `createdAt` | Date | auto | Added by `timestamps` |
| `updatedAt` | Date | auto | Added by `timestamps` |

**Indexes:** index on `user`, so each user's task list is fast to load.

**Example document**
```json
{
  "_id": "665f2a4c9b1e8a0012a4d222",
  "user": "665f1c0a9b1e8a0012a4d111",
  "title": "Write report",
  "description": "Final draft",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-10-20T00:00:00.000Z",
  "createdAt": "2026-10-13T09:00:00.000Z",
  "updatedAt": "2026-10-13T09:30:00.000Z"
}
```

## Design notes

- **Ownership:** every task query filters by the logged-in user's id, so users only ever see their own tasks.
- **Overdue** is not stored. It is calculated when needed: a task is overdue when `dueDate` is before today and `status` is not `done`.
- **Passwords** are never stored in plain text and never returned by the API.
- **Dates** are stored in UTC. A deadline chosen as `2026-10-20` is stored as midnight UTC on that day.