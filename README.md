# ScamGuard AI

ScamGuard AI is a full-stack voice analysis platform that helps users detect suspicious, cloned, or AI-generated voices from uploaded recordings and live microphone input. The application combines a React frontend, a FastAPI backend, real-time WebSocket streaming, and a CNN-Conformer-based audio classification pipeline.

It is designed for practical use as a demo-ready product: users can register, run live or file-based analysis, review detection history, download PDF reports, and monitor trends from a dashboard. Administrators also get access to system-wide usage and user management tools.
 # Live Demo
🔗 Frontend (Vercel): https://scam-guard-ai-nu.vercel.app/
🔗 Backend API (Render): https://scamguard-ai-67da.onrender.com/

You can directly access the UI from the frontend link and test API endpoints via the backend.

## Highlights

- Live voice analysis over WebSocket for near real-time detection
- Audio file upload workflow for recorded call analysis
- JWT-based authentication with user and admin roles
- Dashboard analytics with recent detections and risk breakdowns
- Detection history with pagination and filtering
- PDF report generation for saved detections
- Multi-language frontend support for English, Hindi, and Marathi
- MongoDB support with automatic fallback to local JSON storage in development
- CNN-Conformer model loading with heuristic fallback if the model is unavailable

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, React Router, Tailwind CSS, Framer Motion, Recharts |
| Backend | FastAPI, Uvicorn, Python 3 |
| Database | MongoDB with Motor, plus local JSON fallback storage |
| Authentication | JWT, `python-jose`, Passlib |
| Audio / ML | TensorFlow, Librosa, NumPy, SciPy |
| Realtime | FastAPI WebSockets |
| Reporting | ReportLab |

## Core Features

### User Features

- Register and log in securely
- Analyze uploaded audio files
- Run live detection using microphone input
- View confidence, label, explanation, and risk level for each detection
- Review past detections in a paginated history view
- Download PDF reports for individual results
- Update profile and password from the settings page
- Switch interface language between English, Hindi, and Marathi

### Admin Features

- View platform-wide statistics
- Review all users and detections
- Promote or demote user roles
- Delete users and associated detection data

## How It Works

1. Audio is uploaded or streamed from the browser.
2. The backend loads and normalizes the audio.
3. A preprocessing pipeline converts the signal into a fixed-size log-Mel spectrogram.
4. If the trained model is available, the backend runs CNN-Conformer inference.
5. If the model cannot be loaded, the app falls back to a deterministic heuristic so the platform still works.
6. The result is stored and returned with:
   - classification label
   - confidence score
   - risk level
   - explanation
   - duration
   - raw score

## Architecture

### Frontend

The React application provides:

- authentication pages
- dashboard analytics
- live detection interface
- file upload analysis
- history management
- admin panel
- settings and language preferences

### Backend

The FastAPI backend provides:

- REST APIs for auth, detection, history, admin, and reports
- WebSocket endpoint for live streaming analysis
- model loading on startup
- audio preprocessing and prediction logic
- MongoDB or fallback local persistence

## Project Structure

```text
scam-detector/
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   |-- seed.py
|   |-- .env.example
|   |-- model/
|   |   `-- cnn_conformer.h5
|   |-- database/
|   |   |-- connection.py
|   |   `-- local_store.py
|   |-- routes/
|   |   |-- admin.py
|   |   |-- auth.py
|   |   |-- detection.py
|   |   |-- history.py
|   |   |-- reports.py
|   |   `-- websocket_route.py
|   `-- utils/
|       |-- audio_processor.py
|       |-- auth.py
|       |-- model_loader.py
|       `-- predictor.py
|-- frontend/
|   |-- package.json
|   |-- public/
|   `-- src/
|       |-- App.js
|       |-- context/
|       |-- components/
|       |-- pages/
|       |-- styles/
|       `-- utils/
|-- database/
|   `-- schema.md
|-- RUN_ME.bat
|-- START_BACKEND.bat
|-- START_FRONTEND.bat
`-- START_ALL_STABLE.bat
```

## Getting Started

### Prerequisites

- Python 3.10 to 3.12 recommended
- Node.js 18+ recommended
- npm
- MongoDB optional

MongoDB is preferred for full persistence, but the backend can still run if MongoDB is unavailable. In that case it automatically uses local JSON-backed storage for development.

## Quick Start on Windows

If you are on Windows, the easiest option is to use the included launcher scripts.

### Option 1: Guided setup

From the project root:

```powershell
.\RUN_ME.bat
```

This script:

- checks Python and Node.js
- creates the backend virtual environment if needed
- installs backend dependencies
- installs frontend dependencies
- offers launch options for backend, frontend, or both

### Option 2: Start both services directly

```powershell
.\START_ALL_STABLE.bat
```

### Option 3: Start services individually

```powershell
.\START_BACKEND.bat
.\START_FRONTEND.bat
```

## Manual Setup

### 1. Backend Setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `.env` if needed, then optionally seed the default admin account:

```powershell
python seed.py
```

Start the backend:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Backend URLs:

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- Redoc: `http://localhost:8000/redoc`
- Health check: `http://localhost:8000/health`

### 2. Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
npm start
```

Frontend URL:

- App: `http://localhost:3000`

## Environment Variables

The backend reads configuration from `backend/.env`.

Example values:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=scam_detector
JWT_SECRET=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
MODEL_PATH=model/cnn_conformer.h5
FRONTEND_URL=http://localhost:3000
```

### Variable Reference

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string |
| `DB_NAME` | Database name |
| `JWT_SECRET` | Secret used to sign access tokens |
| `JWT_ALGORITHM` | JWT algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes |
| `MODEL_PATH` | Path to the trained model file |
| `FRONTEND_URL` | Allowed frontend origin for CORS |

## Default Admin Account

If you run `python seed.py`, the app creates this default admin user:

| Field | Value |
| --- | --- |
| Email | `admin@scamguard.ai` |
| Password | `admin123` |
| Role | `admin` |

Change both the default password and JWT secret before using the project outside local development.

## API Overview

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Get current user profile |
| `PUT` | `/api/auth/me` | Update profile |
| `POST` | `/api/auth/change-password` | Change password |

### Detection

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/detection/upload` | Analyze an uploaded audio file |
| `POST` | `/api/detection/live` | Analyze a live audio chunk |
| `GET` | `/api/detection/{detection_id}` | Get a saved detection |
| `WS` | `/ws/live/{token}` | Live streaming detection endpoint |

### History and Reports

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/history/` | Get paginated detection history |
| `GET` | `/api/history/analytics` | Get dashboard analytics |
| `DELETE` | `/api/history/{detection_id}` | Delete one detection |
| `DELETE` | `/api/history/` | Clear current user's history |
| `GET` | `/api/reports/pdf/{detection_id}` | Download a PDF report |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Get platform statistics |
| `GET` | `/api/admin/users` | List users |
| `DELETE` | `/api/admin/users/{user_id}` | Delete a user and their data |
| `PUT` | `/api/admin/users/{user_id}/role` | Change a user's role |
| `GET` | `/api/admin/detections` | List all detections |

For the full live API contract, use the built-in docs at `http://localhost:8000/docs`.

## Supported Audio Inputs

The backend accepts common audio formats including:

- WAV
- MP3
- OGG
- WebM
- FLAC
- M4A-style uploads when delivered through compatible browser MIME handling

## Persistence Behavior

The application prefers MongoDB, but the backend was built to remain usable even without it.

- If MongoDB is available, data is stored in the configured database.
- If MongoDB is unavailable, the backend falls back to a local JSON storage implementation.
- Detection uploads are saved under the backend `uploads/` directory.

This makes local demos and development easier, especially on machines where MongoDB is not installed.

## Security Notes

Before deploying or sharing publicly:

- replace the default `JWT_SECRET`
- change the default admin password
- review CORS origins in `FRONTEND_URL`
- store secrets outside committed files
- use HTTPS in production

## Troubleshooting

### Backend starts but MongoDB is unavailable

This is supported. The backend will log a warning and use local JSON storage instead.

### Model does not load

Check that the file exists at:

```text
backend/model/cnn_conformer.h5
```

You can also point `MODEL_PATH` to a custom model location. If the model still cannot be loaded, the app will use heuristic fallback predictions.

### Frontend cannot reach the backend

Make sure:

- backend is running on `http://localhost:8000`
- frontend is running on `http://localhost:3000`
- `FRONTEND_URL` matches the frontend origin
- the frontend proxy in `frontend/package.json` still points to `http://localhost:8000`

### Microphone access fails

Make sure:

- the browser has permission to use the microphone
- you are using `localhost` or a secure origin
- no other application is exclusively locking the microphone

