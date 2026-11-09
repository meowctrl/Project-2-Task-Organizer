# Daymark HTTP API

Base URL: `http://localhost:3001/api`

The API uses JSON request and response bodies. Authentication uses Flask's signed session in an HTTP-only cookie. Browser clients on a configured origin must use `credentials: 'include'` on every request after login. Non-browser clients should retain and resend the session cookie.

## Data models

`User`, `TaskList`, `Task`, and `ProductivityReport` are SQLAlchemy models stored in SQLite. `User` records keep a password hash privately. The API only returns the public user shape.

```json
{
  "id": "uuid",
  "name": "Alex Morgan",
  "email": "alex@example.test",
  "passwordHash": "Werkzeug password hash"
}
```

```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "Inbox",
  "color": "#78947e",
  "createdAt": "2026-11-07T12:00:00.000Z"
}
```

```json
{
  "id": "uuid",
  "userId": "uuid",
  "listId": "uuid",
  "title": "Prepare weekly plan",
  "note": "Optional details",
  "dueDate": "2026-11-10",
  "completed": false,
  "createdAt": "2026-11-07T12:00:00.000Z"
}
```

```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Daily recap 2026-11-07",
  "response": {
    "totalTasks": 12,
    "completedTasks": 5,
    "openTasks": 7,
    "dueToday": 2,
    "lists": []
  },
  "createdAt": "2026-11-07T12:00:00.000Z"
}
```

Every list, task, and report is owned by a user. A task belongs to one list; deleting a list deletes its tasks. The report's JSON `response` is stored in the `productivity_reports` table. Responses omit `passwordHash`.

```js
const api = 'http://localhost:3001/api'

const response = await fetch(`${api}/auth/login`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})

if (!response.ok) {
  const { error } = await response.json()
  throw new Error(error)
}

const { user } = await response.json()
```

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/auth/me` | Return the signed-in user, or `{ "user": null }` |
| POST | `/auth/signup` | Create an account with `{ name, email, password }` |
| POST | `/auth/login` | Sign in with `{ email, password }` |
| POST | `/auth/logout` | End the session |

Passwords must be at least eight characters. The API stores Werkzeug password hashes, never plain-text passwords.

## Lists

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/lists` | Get the signed-in user's lists |
| POST | `/lists` | Create a list with `{ name }` |
| PATCH | `/lists/:id` | Rename a list with `{ name }` |
| DELETE | `/lists/:id` | Delete a list and its tasks |

List names must be unique per account. The final list cannot be deleted.

## Tasks

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tasks` | Get all of the signed-in user's tasks; optionally filter with `?listId=...` |
| POST | `/tasks` | Create with `{ title, listId, note?, dueDate? }` |
| PATCH | `/tasks/:id` | Update any of `title`, `listId`, `note`, `dueDate`, or `completed` |
| DELETE | `/tasks/:id` | Delete a task |

Task titles are 1-120 characters, notes are limited to 500 characters, and due dates use `YYYY-MM-DD`.

## Reports

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/reports` | List saved recaps for the signed-in user |
| POST | `/reports` | Generate a deterministic task summary and save its JSON response |

Each response contains total, open, completed, and due-today task counts plus per-list open counts. Reports are generated locally; no AI or external service is called.

## Errors and external clients

Errors use `{ "error": "..." }`. Common status codes are `400` for invalid input, `401` for missing authentication, `404` for a missing or unowned resource, `409` for duplicate accounts/lists, and `500` for unexpected server errors.

The default CORS origin is `http://localhost:5173`. Set `CLIENT_ORIGINS` to exact, comma-separated origins to permit other browser frontends. The Flask server binds to `127.0.0.1` by default; set `HOST=0.0.0.0` only when a trusted LAN client needs to reach it, and do not expose the development server publicly. CORS is not authentication: all list and task routes still require the session. For a frontend hosted on a different site, use HTTPS, set `SESSION_COOKIE_SAMESITE=None`, `SESSION_COOKIE_SECURE=1`, and a strong `SECRET_KEY` in the API environment.

There is no AI service or third-party API integration; recap responses are computed from local SQL data.