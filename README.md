## Aurahealth 

Monorepo for the Aurahealth full-stack web application.

### Backend (`backend`)

- **Stack**: Node.js, Express.js, MongoDB (Mongoose), Socket.io, JWT, bcrypt, WebRTC signaling
- **Key features**:
  - JWT auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`)
  - Roles: doctor, patient, admin (RBAC enforced with middleware)
  - Appointment management (`/api/appointments`)
  - Socket.io for:
    - Online status (userId ↔ socketId map)
    - Private chat between doctor and patient
    - WebRTC signaling (`offer`, `answer`, `ice-candidate`)

**Run backend:**

```bash
cd backend
cp .env.example .env   # adjust values
npm install
npm run dev
```

### Frontend (`frontend`)

- **Stack**: React (Vite), React Router, Context API, Tailwind CSS, Socket.io-client, WebRTC APIs
- **Key features**:
  - Auth pages (`/login`, `/register`)
  - Role dashboards: doctor, patient, admin
  - Protected routes based on role
  - Video call page (`/video/:roomId`) using WebRTC + Socket.io

**Run frontend:**

```bash
cd frontend
cp .env.example .env   # optional, adjust if backend URL changes
npm install
npm run dev
```

By default the backend runs on `http://localhost:5000` and frontend on `http://localhost:5173`. Update `CLIENT_ORIGIN` (backend) and `VITE_API_BASE` / `VITE_SOCKET_URL` (frontend) if you change ports or deploy.

