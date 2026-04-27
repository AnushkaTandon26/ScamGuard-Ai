# Database Schema — AI Voice Scam Detection System
MongoDB (NoSQL) — Database: `scam_detector`

---

## Collection: `users`

| Field           | Type     | Description                          |
|-----------------|----------|--------------------------------------|
| _id             | ObjectId | Auto-generated primary key           |
| username        | String   | Unique username (indexed)            |
| email           | String   | Unique email address (indexed)       |
| password        | String   | bcrypt-hashed password               |
| full_name       | String   | Display name                         |
| role            | String   | "user" or "admin"                    |
| created_at      | DateTime | Account creation timestamp           |
| last_login      | DateTime | Last login timestamp                 |
| total_scans     | Int      | Total number of detections           |
| scams_detected  | Int      | Count of scam detections             |
| language        | String   | Preferred UI language ("en","hi","mr")|

**Indexes:** `email` (unique), `username` (unique)

---

## Collection: `detections`

| Field       | Type     | Description                              |
|-------------|----------|------------------------------------------|
| _id         | ObjectId | Auto-generated primary key               |
| user_id     | ObjectId | Reference to users._id                  |
| file_name   | String   | Original uploaded filename               |
| file_path   | String   | Server path to saved audio file          |
| source      | String   | "upload" or "live"                       |
| is_scam     | Boolean  | True = scam detected                     |
| label       | String   | "SCAM" or "GENUINE"                      |
| confidence  | Float    | Confidence percentage (0–100)            |
| risk_level  | String   | "High", "Medium", or "Low"               |
| explanation | String   | AI-generated reasoning text              |
| duration    | Float    | Audio duration in seconds                |
| raw_score   | Float    | Raw model sigmoid output (0–1)           |
| created_at  | DateTime | Detection timestamp                      |

**Indexes:** `user_id` (ascending), `created_at` (descending), `is_scam` (ascending)

---

## Sample Documents

### User
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "username": "janedoe",
  "email": "jane@example.com",
  "password": "$2b$12$...",
  "full_name": "Jane Doe",
  "role": "user",
  "created_at": "2024-06-01T10:00:00Z",
  "last_login": "2024-06-10T14:22:00Z",
  "total_scans": 14,
  "scams_detected": 3,
  "language": "en"
}
```

### Detection
```json
{
  "_id": "665a1b2c3d4e5f6a7b8c9d1f",
  "user_id": "665a1b2c3d4e5f6a7b8c9d0e",
  "file_name": "call_recording.wav",
  "file_path": "/uploads/abc123.wav",
  "source": "upload",
  "is_scam": true,
  "label": "SCAM",
  "confidence": 91.4,
  "risk_level": "High",
  "explanation": "Detected robotic voice patterns...",
  "duration": 12.5,
  "raw_score": 0.914,
  "created_at": "2024-06-10T14:22:05Z"
}
```
