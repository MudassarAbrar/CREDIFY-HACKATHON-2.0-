# Environment Variables Setup

Copy the relevant variables into your `.env` files. Never commit real `.env` files to git.

---

## Backend (server/.env)

Create or edit `server/.env`:

```env
# Database (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=peer_skill_exchange
DB_PORT=3306

# JWT (required for auth)
# Where to get JWT_SECRET: Generate a random string (at least 32 characters).
# Option 1 (Node): node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Option 2 (OpenSSL): openssl rand -hex 32
# Option 3: Use any long random string (e.g. a password manager generator).
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:8080

# Google OAuth (optional – for "Sign in with Google")
# Get these from https://console.cloud.google.com/apis/credentials
# Create an "OAuth 2.0 Client ID" (Web application), add authorized JS origins e.g. http://localhost:8080
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

- **GOOGLE_CLIENT_ID**: Same value as the frontend Web client ID from Google Cloud Console. If not set, Google sign-in is disabled and the API will return a 503 when used.

---

## Frontend (root .env)

Create or edit `.env` in the project root (next to `package.json`):

```env
# API base URL (optional; dev proxy uses /api → localhost:3001)
VITE_API_URL=http://localhost:3001/api

# Google OAuth (optional – for "Sign in with Google" button)
# Must match the Web client ID from Google Cloud Console (same as backend GOOGLE_CLIENT_ID)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

- **VITE_GOOGLE_CLIENT_ID**: Web client ID from Google Cloud Console. If not set, the "Continue with Google" option still appears but shows a setup message when clicked.

---

## Google OAuth Setup Steps

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Open **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
4. Application type: **Web application**.
5. Add **Authorized JavaScript origins** (e.g. `http://localhost:8080`, `https://yourdomain.com`).
6. Add **Authorized redirect URIs** if required (for some flows).
7. Copy the **Client ID** (e.g. `xxx.apps.googleusercontent.com`).
8. Use this **exact same** Client ID in both:
   - **Backend** `server/.env`: `GOOGLE_CLIENT_ID=...`
   - **Frontend** `.env`: `VITE_GOOGLE_CLIENT_ID=...`
9. Restart the backend server and frontend dev server after changing env.

---

## Summary Table

| Variable               | Where       | Required | Description                    |
|------------------------|-------------|----------|--------------------------------|
| DB_HOST, DB_USER, etc. | server/.env | Yes      | MySQL connection               |
| JWT_SECRET             | server/.env | Yes      | Secret for signing JWTs       |
| PORT                   | server/.env | No       | Backend port (default 3001)    |
| FRONTEND_URL           | server/.env | No       | CORS origin (default 8080)     |
| GOOGLE_CLIENT_ID       | server/.env | No       | Google OAuth (backend verify)  |
| VITE_GOOGLE_CLIENT_ID  | .env        | No       | Google OAuth (frontend button) |
| VITE_API_URL           | .env        | No       | Override API base URL          |
