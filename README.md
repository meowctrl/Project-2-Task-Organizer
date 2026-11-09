## Daymark

A small task organizer with private sign-up/sign-in, task lists, and tasks.

## Run locally

```sh
# Create and activate a Python environment first.
python -m venv .venv
# PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
npm install
npm run dev
```

Open http://localhost:5173. The Vite frontend and Flask API start together. Sign up with a name, email, and password of at least eight characters. The Flask API runs at http://localhost:3001.

Run the backend tests with `npm run test:api` while the Python environment is active.

## HTTP API

The API listens at `http://localhost:3001/api`. Requests from `http://localhost:5173` are allowed by default. To allow another browser frontend, set `CLIENT_ORIGINS` to its exact origin; multiple origins can be comma-separated. Credentialed clients must send cookies. The Flask server binds to loopback by default; for a trusted LAN client, set `HOST=0.0.0.0` and allow only the frontend's exact origin. Do not expose the Flask development server to the public internet. See [API.md](API.md) for model shapes, routes, request examples, and error responses.

| Resource | Routes |
| --- | --- |
| Authentication | `GET /auth/me`, `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout` |
| Lists | `GET /lists`, `POST /lists`, `PATCH /lists/:id`, `DELETE /lists/:id` |
| Tasks | `GET /tasks`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id` |
| Reports | `GET /reports`, `POST /reports` |

## What is included

- Today, Upcoming, and All tasks navigation
- Create, rename, and delete lists; deleting a list also deletes its tasks, and the last list is protected
- Create, edit, complete, and delete tasks, with optional notes and due dates
- Generate and view saved productivity recaps; generated JSON responses persist in SQLite
- Flask session authentication with Werkzeug password hashes
- Per-user ownership checks, request validation, and visible API errors
- SQLite persistence in `instance/daymark.sqlite3` with SQLAlchemy `User`, `TaskList`, `Task`, and `ProductivityReport` models
- No AI or third-party API integration; all app requests go to the local API

The React components focus on one UI responsibility each. Frontend API requests and shared loading/error state live in `src/hooks/useOrganizerApi.js`.

## Submission

See [SUBMISSION.md](SUBMISSION.md) for the written reflection.

## Demo boundary

This is a local demonstration, not a production deployment template. It uses SQLite and Flask's signed client-side session cookie. Production use needs a managed database, HTTPS, a strong `SECRET_KEY`, and `SESSION_COOKIE_SAMESITE=None` when the browser frontend is on a different site.
