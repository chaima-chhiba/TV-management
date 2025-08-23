# TV Signage Management System

A complete digital signage solution.

## Features

- **Admin UI (React + Vite):** Manage TVs, content (text/image/video), and schedules.
- **Public Display:** Plays scheduled content on any TV/browser via `/display/:tvNameOrId`.
- **Backend API (Express + MongoDB):** JWT-protected admin endpoints and public read-only endpoints for Displays.
- **Scheduling:** Required for all content (days of week, time window, date range, timezone).
- **Layouts:** Optional per-content (`auto`, `fullscreen`, `split2`, `split4`).
- **Responsive Display:** Fills screen perfectly, no scrolling, with HUD (time/date/weather) and fallback screen.
- **TV Status:** Public ping marks TVs online; dashboard shows real-time status.
- **Toasts:** Success/error notifications for admin actions.


## Tech Stack

- **Frontend:** React, Vite, lucide-react, fetch API
- **Backend:** Node.js/Express, Mongoose/MongoDB, JWT, CORS

## Project Structure

```
tv-management-frontend/
  src/pages/         # Dashboard, TVs, ContentLibrary, Schedule, Display
  src/components/    # ContentForm, TVCard, ToastProvider, etc.
  src/services/      # API services
  src/routes/        # AppRouter
tv-management-backend/
  server.js
  models/            # TV.js, Content.js, Schedule.js
  controllers/       # tvController.js, contentController.js, scheduleController.js
  routes/            # tv.js, content.js, schedule.js
  middleware/        # authMiddleware.js
```

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or remote
- Windows (recommended for commands below)

### Environment Variables

**Backend (.env):**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/tv-management
JWT_SECRET=your_secret
```

**Frontend (.env):**
```
VITE_API_BASE_URL=http://localhost:5000
```

### Installation & Running

**Backend:**
```powershell
cd tv-management-backend
npm install
npm run dev
```

**Frontend:**
```powershell
cd tv-management-frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.



## API Summary

**Public (no auth):**
- `GET /api/public/content` — List content for Displays
- `GET /api/public/schedule/tv/:tvId` — Schedules for a TV
- `GET /api/public/tv/by-name/:name` — Resolve TV name to id
- `POST /api/public/tv/:id/ping` — Mark TV online/offline

**Protected (JWT):**
- `/api/content` — CRUD content
- `/api/tv` — CRUD TVs
- `/api/schedule` — CRUD schedules

## Data Models

- **Content:** type, layout, tv, duration, schedule
- **TV:** name (unique), department, status, lastSeen
- **Schedule:** tvId, contentId, daysOfWeek, time window, date range, timezone

## Frontend Routes

- `/` — Dashboard
- `/tvs` — Manage TVs
- `/content` — Content Library
- `/schedule` — Manage schedules
- `/display/:tvNameOrId` — Public Display

## Troubleshooting

- **404 on /api/schedule:** Ensure you mounted `app.use('/api/schedule', authenticateJWT, scheduleRoutes)`
- **ReferenceError authenticateJWT:** Import from `middleware/authMiddleware`
- **Layout required:** Allow `'auto'` in Content model enum and default to `'auto'`
- **Popups blocked:** "Open All" removed by design
- **CORS:** `app.use(cors())` is enabled; set `VITE_API_BASE_URL` to backend origin

## Authors

- Chaima Chhiba

