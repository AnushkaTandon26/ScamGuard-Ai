"""
Detection routes:
  POST /api/detection/upload   — upload an audio file, get prediction
  POST /api/detection/live     — send a live audio chunk, get real-time prediction
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from datetime import datetime
from bson import ObjectId
import os, uuid, aiofiles

from database.connection import get_db
from utils.auth import get_current_user
from utils.predictor import run_prediction

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_TYPES = {
    "audio/wav", "audio/wave", "audio/mpeg", "audio/mp3",
    "audio/ogg", "audio/webm", "audio/flac", "audio/x-wav",
    "audio/x-m4a", "application/octet-stream"
}

def serialize_detection(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"]      = str(doc.pop("_id", ""))
    doc["user_id"] = str(doc.get("user_id", ""))
    return doc


@router.post("/upload")
async def detect_uploaded_audio(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """Receive an audio file, run prediction, store and return result."""
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {file.content_type}. Use WAV, MP3, OGG, FLAC, or WebM."
        )

    # Read bytes
    audio_bytes = await file.read()
    if len(audio_bytes) < 1024:
        raise HTTPException(status_code=400, detail="Audio file too small")

    # Save file to disk
    filename  = f"{uuid.uuid4()}.wav"
    file_path = os.path.join(UPLOAD_DIR, filename)
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(audio_bytes)

    # Run AI prediction
    result = run_prediction(audio_bytes)

    db = get_db()

    # Build detection document
    detection_doc = {
        "user_id":      current_user["_id"],
        "file_name":    file.filename,
        "file_path":    f"/uploads/{filename}",
        "source":       "upload",
        "is_scam":      result["is_scam"],
        "label":        result["label"],
        "confidence":   result["confidence"],
        "risk_level":   result["risk_level"],
        "explanation":  result["explanation"],
        "duration":     result["duration"],
        "raw_score":    result["raw_score"],
        "created_at":   datetime.utcnow(),
    }

    inserted = await db.detections.insert_one(detection_doc)
    detection_doc["_id"] = inserted.inserted_id

    # Update user stats
    update = {"$inc": {"total_scans": 1}}
    if result["is_scam"]:
        update["$inc"]["scams_detected"] = 1
    await db.users.update_one({"_id": current_user["_id"]}, update)

    return {
        "detection_id": str(inserted.inserted_id),
        "result": result,
        "saved": True,
    }


@router.post("/live")
async def detect_live_chunk(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
):
    """
    Receive a small live audio chunk (e.g. 3-5 seconds from microphone),
    run prediction, save it, and return the live result.
    """
    audio_bytes = await file.read()
    if len(audio_bytes) < 512:
        return {"status": "too_short", "message": "Chunk too small to analyze"}

    result = run_prediction(audio_bytes, frame_selection="tail")
    db = get_db()

    detection_doc = {
        "user_id":      current_user["_id"],
        "file_name":    file.filename or "Live Recording",
        "source":       "live",
        "is_scam":      result["is_scam"],
        "label":        result["label"],
        "confidence":   result["confidence"],
        "risk_level":   result["risk_level"],
        "explanation":  result["explanation"],
        "duration":     result["duration"],
        "raw_score":    result["raw_score"],
        "created_at":   datetime.utcnow(),
    }

    inserted = await db.detections.insert_one(detection_doc)

    update = {"$inc": {"total_scans": 1}}
    if result["is_scam"]:
        update["$inc"]["scams_detected"] = 1
    await db.users.update_one({"_id": current_user["_id"]}, update)

    return {
        "status": "ok",
        "detection_id": str(inserted.inserted_id),
        "result": result,
        "saved": True,
    }


@router.get("/{detection_id}")
async def get_detection(
    detection_id: str,
    current_user = Depends(get_current_user),
):
    """Get a single detection by ID."""
    db = get_db()
    try:
        oid = ObjectId(detection_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid detection ID")

    doc = await db.detections.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Detection not found")

    # Only owner or admin can view
    if str(doc["user_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    return serialize_detection(doc)
