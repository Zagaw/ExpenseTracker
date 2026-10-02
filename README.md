# Expense Tracker

Personal finance workspace with a React frontend and an Express + MongoDB backend.

## Prerequisites

- Node.js
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

Backend:

```bash
cd backend
copy .env.example .env
```

`backend/.env` is already set for a local database:

```text
mongodb://127.0.0.1:27017/expense-tracker
```

For MongoDB Atlas, replace `MONGODB_URI` with your cluster connection string. Keep that value only in `backend/.env`.

Frontend:

```bash
cd frontend
copy .env.example .env
```

`VITE_API_URL` should stay `http://localhost:5000/api` during local development.

## Run

In one terminal:

```bash
cd backend
npm run dev
```

In another terminal:

```bash
cd frontend
npm run dev
```

- App: http://localhost:5173
- API health: http://localhost:5000/health

The API listens only after MongoDB connects. A healthy response is `{ "status": "ok" }`.

Do not commit `.env` files. `.gitignore` already excludes them.
