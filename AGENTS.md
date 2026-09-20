# CineMatch - Agent Guidelines

## Project Structure
- `server/` - Express + Socket.IO backend (runs on port 4000)
- `src/` - React + Vite frontend (runs on port 5173)
- `shared/` - Shared TypeScript types

## Authentication Flow
- Google OAuth via `/api/auth/google` and `/api/auth/google/callback`
- Email/password auth via `/api/auth/register` and `/api/auth/login`
- Session cookie: `cinematch_session` (httpOnly, signed, sameSite: lax)
- Accounts stored in `server/data/accounts.json`

## Required Environment Variables (.env)
```
VITE_API_BASE=http://localhost:4000
VITE_SOCKET_URL=http://localhost:4000
VITE_TMDB_API_KEY=<your-tmdb-key>
GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<your-google-oauth-client-secret>
```

Google OAuth credentials: Create a project at https://console.cloud.google.com/, enable Google+ API, and configure OAuth consent screen. Add `http://localhost:5173` as an authorized origin and `http://localhost:4000/api/auth/google/callback` as an authorized redirect URI.

## Running the Project
```bash
# Install dependencies
npm install

# Start both frontend and backend
npm run dev:full

# Or separately:
npm run dev        # Frontend (Vite)
npm run dev:server # Backend (Node)
```

## Key Implementation Details
- Each room participant tracks their own card index independently (local state in RoomScreen)
- Server tracks votes globally per room but does NOT track card index
- Swipe direction mapping: UI "right" = server "like", UI "left" = server "skip"
- Socket events: joinRoom, leaveRoom, swipe, startRoom, chatMessage, addMovie, selectGenre, shuffleMovies
