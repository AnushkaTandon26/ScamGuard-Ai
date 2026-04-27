# 🛡️ ScamGuard AI — Voice Scam Detection System

An AI-powered full-stack web application that detects scam calls in real time using a CNN-Conformer deep learning model.

---

## 🏗️ Full Project Structure

```
scam-detector/
├── backend/
│   ├── main.py                        ← FastAPI entry point
│   ├── requirements.txt
│   ├── seed.py                        ← Creates default admin user
│   ├── .env                           ← Environment variables
│   ├── model/
│   │   └── cnn_conformer.h5           ← Your trained model (already placed here)
│   ├── database/
│   │   └── connection.py              ← MongoDB async connection
│   ├── routes/
│   │   ├── auth.py                    ← Register / Login / Profile
│   │   ├── detection.py               ← Upload + live chunk detection
│   │   ├── history.py                 ← Call history + analytics
│   │   ├── admin.py                   ← Admin panel APIs
│   │   ├── reports.py                 ← PDF report generation
│   │   └── websocket_route.py         ← Real-time WebSocket streaming
│   └── utils/
│       ├── model_loader.py            ← Loads CNN-Conformer .h5 at startup
│       ├── audio_processor.py         ← Mel-spectrogram preprocessing
│       ├── predictor.py               ← Runs inference + generates explanation
│       └── auth.py                    ← JWT + password utilities
│
├── frontend/
│   ├── package.json
│   ├── tailwind.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js
│       ├── App.js                     ← Routes + Providers
│       ├── styles/index.css           ← Tailwind + custom CSS
│       ├── context/
│       │   └── AuthContext.js         ← Global auth state
│       ├── utils/
│       │   ├── api.js                 ← All backend API calls
│       │   └── i18n.js                ← EN / Hindi / Marathi translations
│       ├── components/
│       │   ├── common/
│       │   │   ├── Layout.js          ← Sidebar + Header wrapper
│       │   │   ├── Sidebar.js         ← Collapsible sidebar nav
│       │   │   └── Header.js          ← Top bar with language switcher
│       │   ├── dashboard/
│       │   │   └── StatCard.js        ← Animated metric card
│       │   └── detection/
│       │       ├── LiveRecorder.js    ← Mic recording + WebSocket streaming
│       │       ├── FileUploader.js    ← Drag-and-drop audio upload
│       │       └── ResultCard.js      ← Scam/Genuine result with ring chart
│       └── pages/
│           ├── LoginPage.js
│           ├── RegisterPage.js
│           ├── DashboardPage.js       ← Analytics + charts
│           ├── LiveDetectPage.js
│           ├── UploadPage.js
│           ├── HistoryPage.js         ← Paginated call history
│           ├── AdminPage.js           ← User management + system stats
│           └── SettingsPage.js        ← Profile, password, language, notifications
│
└── database/
    └── schema.md                      ← MongoDB collection documentation
```

---

## ⚡ QUICK START (3 terminals)

### Terminal 1 — MongoDB
```bash
# Option A: Local MongoDB
sudo systemctl start mongod         # Linux
brew services start mongodb-community  # Mac

# Option B: Docker (easiest)
docker run -d -p 27017:27017 --name scam-mongo mongo:7
```

### Terminal 2 — Backend
```bash
cd scam-detector/backend

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Seed admin user (run once)
python seed.py

# Start backend server
uvicorn main:app --reload --port 8000
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### Terminal 3 — Frontend
```bash
cd scam-detector/frontend

# Install npm packages
npm install

# Start React dev server
npm start
```

Frontend runs at: **http://localhost:3000**

---

## 🔑 Default Login

| Field    | Value               |
|----------|---------------------|
| Email    | admin@scamguard.ai  |
| Password | admin123            |
| Role     | Admin               |

> ⚠️ Change the admin password after first login in Settings.

---

## 🧠 Your AI Model

Your `cnn_conformer.h5` has been placed at `backend/model/cnn_conformer.h5`.

**Model architecture detected:**
- Input: `(128, 128, 1)` — Log-Mel spectrogram
- CNN: Conv2D(32) → MaxPool → Conv2D(64) → MaxPool
- Transformer: MultiHeadAttention (4 heads) + LayerNorm
- Output: Dense(1, sigmoid) → 0 = Genuine, 1 = Scam

**Preprocessing pipeline:**
1. Load audio → resample to 16kHz
2. Bandpass filter (80Hz–8kHz, human voice range)
3. Extract 128-band log-Mel spectrogram
4. Pad/trim to 128 frames
5. Normalize to [0, 1]
6. Shape: `(1, 128, 128, 1)` → model input

To replace the model, drop a new `.h5` file at `backend/model/cnn_conformer.h5`
and restart the backend. No code changes needed.

---

## 🌟 All 15 Features

| # | Feature                   | Location                        |
|---|---------------------------|---------------------------------|
| 1 | Live mic recording        | /live — WebSocket streaming     |
| 2 | Audio file upload         | /upload — drag & drop           |
| 3 | Real-time AI prediction   | CNN-Conformer inference engine  |
| 4 | Confidence score          | ResultCard — animated ring      |
| 5 | Risk level indicator      | High / Medium / Low with color  |
| 6 | Call history storage      | MongoDB + paginated table       |
| 7 | JWT authentication        | Register / Login / Profile      |
| 8 | Dashboard analytics       | Charts: Area, Pie, Bar          |
| 9 | Dark mode UI              | Full dark theme (slate palette) |
|10 | Notifications / alerts    | react-hot-toast on scam detect  |
|11 | Waveform visualization    | Animated bars in LiveRecorder   |
|12 | PDF report download       | reportlab — per-detection PDF   |
|13 | Multi-language support    | English / Hindi / Marathi       |
|14 | REST API endpoints        | FastAPI + auto Swagger docs     |
|15 | Admin panel               | User management + system stats  |

---

## 🌐 API Endpoints

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /api/auth/register              | Create account               |
| POST   | /api/auth/login                 | Login, get JWT token         |
| GET    | /api/auth/me                    | Get current user             |
| POST   | /api/detection/upload           | Analyze uploaded audio file  |
| POST   | /api/detection/live             | Analyze a live audio chunk   |
| GET    | /api/history/                   | Paginated call history       |
| GET    | /api/history/analytics          | Dashboard stats              |
| DELETE | /api/history/{id}               | Delete one record            |
| GET    | /api/reports/pdf/{id}           | Download PDF report          |
| GET    | /api/admin/stats                | System-wide stats (admin)    |
| GET    | /api/admin/users                | All users (admin)            |
| WS     | /ws/live/{token}                | Live audio WebSocket stream  |

Full interactive docs: **http://localhost:8000/docs**

---

## 🛠️ Troubleshooting

**MongoDB not connecting:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# Or use Docker
docker start scam-mongo
```

**Model not loading:**
```
Verify file exists: backend/model/cnn_conformer.h5
Check backend terminal for "✅ Model loaded" message
The system will use simulation mode if the model file is missing
```

**Microphone not working:**
```
- Browser must be on localhost or HTTPS for mic access
- Click "Allow" when browser asks for microphone permission
- Check browser console for errors
```

**Frontend can't reach backend:**
```bash
# Check the proxy in package.json is set to:
"proxy": "http://localhost:8000"

# Or set in frontend/.env:
REACT_APP_API_URL=http://localhost:8000
```

---

## 📦 Tech Stack

| Layer      | Technology                                          |
|------------|-----------------------------------------------------|
| Frontend   | React 18, Tailwind CSS, Framer Motion, Recharts     |
| Backend    | FastAPI, Uvicorn, Python 3.10+                      |
| AI/ML      | TensorFlow 2.x, Librosa, NumPy, SciPy              |
| Database   | MongoDB 7 + Motor (async driver)                    |
| Auth       | JWT (python-jose) + bcrypt (passlib)                |
| Reports    | ReportLab (PDF generation)                          |
| Realtime   | WebSockets (FastAPI native)                         |
| i18n       | i18next (EN / Hindi / Marathi)                      |
