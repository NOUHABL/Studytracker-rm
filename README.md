# StudyTracker

A full-stack study tracking platform with Chrome extension for monitoring study sessions and browsing activity.

## Architecture

```
Chrome Extension
      │
      │ sends browsing activity (POST /activity)
      ▼
Backend API (Node.js + Express)
      │
      │ stores sessions & activity
      ▼
Database (Supabase / PostgreSQL)
      │
      │ queried by
      ▼
Frontend Dashboard (Next.js)
```

## Project Structure

```
studytracker/
├── README.md
├── database/
│   └── schema.sql               # PostgreSQL schema + seed data
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── index.js             # Entry point
│       ├── config/
│       │   └── supabase.js      # Supabase client
│       ├── middleware/
│       │   ├── auth.js          # JWT verification
│       │   └── rateLimit.js     # Rate limiting
│       ├── controllers/
│       │   ├── sessions.js      # Session CRUD logic
│       │   ├── activity.js      # Browsing activity logic
│       │   └── stats.js         # Dashboard stats logic
│       └── routes/
│           ├── sessions.js      # /sessions routes
│           ├── activity.js      # /activity routes
│           └── stats.js         # /stats routes
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout
│       │   ├── page.tsx         # Redirect to dashboard
│       │   ├── login/
│       │   │   └── page.tsx     # Login page
│       │   ├── dashboard/
│       │   │   └── page.tsx     # Stats dashboard
│       │   └── sessions/
│       │       └── page.tsx     # Active session + history
│       ├── components/
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Card.tsx
│       │   │   └── Badge.tsx
│       │   ├── charts/
│       │   │   ├── DailyChart.tsx
│       │   │   ├── WeeklyChart.tsx
│       │   │   └── SubjectPieChart.tsx
│       │   └── session/
│       │       ├── SessionTimer.tsx
│       │       ├── SessionForm.tsx
│       │       └── SessionHistory.tsx
│       ├── lib/
│       │   ├── api.ts           # API client helpers
│       │   ├── supabase.ts      # Supabase browser client
│       │   └── utils.ts         # Formatters, helpers
│       └── types/
│           └── index.ts         # Shared TypeScript types
└── extension/
    ├── manifest.json            # MV3 manifest
    ├── popup.html               # Extension popup UI
    └── src/
        ├── background.js        # Service worker
        ├── content.js           # Content script
        └── popup.js             # Popup logic
```

## Quick Start

### 1. Database Setup
```bash
# Create a project at supabase.com
# Run database/schema.sql in the SQL editor
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in your Supabase credentials
npm install
npm run dev                  # starts on http://localhost:3001
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env.local  # fill in API URL + Supabase credentials
npm install
npm run dev                  # starts on http://localhost:3000
```

### 4. Chrome Extension
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" → select the `extension/` folder
4. Click the extension icon to open the popup

## Environment Variables

### Backend `.env`
```
PORT=3001
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Deployment

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend  | Vercel   | `vercel --prod` in `/frontend` |
| Backend   | Render / Railway | Set env vars in dashboard |
| Database  | Supabase | Managed PostgreSQL |

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sessions/start` | Start a study session |
| POST | `/sessions/end` | End a session |
| GET  | `/sessions` | List all sessions |
| POST | `/activity` | Log browsing activity (extension) |
| GET  | `/stats/today` | Today's stats |
| GET  | `/stats/week` | Weekly stats |
| GET  | `/stats/subjects` | Per-subject breakdown |
