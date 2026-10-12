# REST API Documentation

**Base URL (production):** `https://YOUR-SERVER.vercel.app/api`
**Base URL (local):** `http://localhost:5000/api`

All request and response bodies are JSON. Task endpoints require a JWT in the header:

```
Authorization: Bearer <token>
```

A token is returned by the register and login endpoints and is valid for 7 days.

## Endpoints at a glance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Check that the API is running |
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Log in and receive a token |
| GET | `/tasks` | Yes | List your tasks (filter, search, sort) |
| POST | `/tasks` | Yes | Create a task |
| PUT | `/tasks/:id` | Yes | Update a task (also used for status changes) |
| DELETE | `/tasks/:id` | Yes | Delete a task |

---

## Health

### `GET /health`

**200 OK**
```json
{ "status": "ok" }
```

---

## Authentication

### `POST /auth/register`

**Body**

| Field | Type | Rules |
|---|---|---|
| `name` | string | required |
| `email` | string | required, unique, stored lowercase |
| `password` | string | required, at least 8 characters, stored as a bcrypt hash |

```json
{ "name": "Asha", "email": "asha@example.com", "password": "supersecret1" }
```

**201 Created**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "665f1c...", "name": "Asha", "email": "asha@example.com" }
}
```

**Errors:** `400` validation failed, `409` `{ "message": "Email already registered" }`

### `POST /auth/login`

**Body**
```json
{ "email": "asha@example.com", "password": "supersecret1" }
```

**200 OK** returns the same shape as register.

**Errors:** `401` `{ "message": "Incorrect email or password" }`

---

## Tasks

Every task belongs to the logged-in user. You can never read, change or delete another user's task: those requests return `404`.

### `GET /tasks`

**Query parameters (all optional)**

| Parameter | Values | Description |
|---|---|---|
| `status` | `todo`, `in-progress`, `done` | Filter by status |
| `priority` | `low`, `medium`, `high` | Filter by priority |
| `search` | text | Case-insensitive match on the title |
| `overdue` | `true` | Only tasks past their deadline that are not done |
| `sortBy` | `createdAt`, `dueDate`, `priority`, `title` | Sort field (default `createdAt`) |
| `order` | `asc`, `desc` | Sort direction (default `desc`) |

Example: `GET /tasks?status=todo&priority=high&sortBy=dueDate&order=asc`

**200 OK**
```json
{
  "tasks": [
    {
      "_id": "665f2a...",
      "user": "665f1c...",
      "title": "Write report",
      "description": "Final draft",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-10-20T00:00:00.000Z",
      "createdAt": "2026-10-13T09:00:00.000Z",
      "updatedAt": "2026-10-13T09:00:00.000Z"
    }
  ]
}
```

### `POST /tasks`

**Body**

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, max 120 characters |
| `description` | string | optional |
| `status` | string | `todo` (default), `in-progress`, `done` |
| `priority` | string | `low`, `medium` (default), `high` |
| `dueDate` | ISO date or `null` | optional deadline |

```json
{ "title": "Write report", "priority": "high", "dueDate": "2026-10-20" }
```

**201 Created** returns `{ "task": { ... } }`

**Errors:** `400` validation failed, `401` missing or invalid token

### `PUT /tasks/:id`

Send any of the task fields above. Changing the status uses this same endpoint.

```json
{ "status": "done" }
```

**200 OK** returns `{ "task": { ... } }` with the updated values.

**Errors:** `404` `{ "message": "Task not found" }`, `400` validation failed

### `DELETE /tasks/:id`

**204 No Content** (empty body)

**Errors:** `404` `{ "message": "Task not found" }`

---

## Error format

```json
{ "message": "Human-readable explanation" }
```

| Code | Meaning |
|---|---|
| 400 | Validation failed (bad or missing field) |
| 401 | Missing, invalid or expired token, or wrong login details |
| 404 | Task not found, or it belongs to another user |
| 409 | Email already registered |
| 500 | Server error |

## Quick test with curl

```bash
# register
curl -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Asha","email":"asha@example.com","password":"supersecret1"}'

# create a task (replace TOKEN)
curl -X POST $BASE/tasks -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"Write report","priority":"high","dueDate":"2026-10-20"}'

# list overdue tasks
curl "$BASE/tasks?overdue=true" -H "Authorization: Bearer TOKEN"
```