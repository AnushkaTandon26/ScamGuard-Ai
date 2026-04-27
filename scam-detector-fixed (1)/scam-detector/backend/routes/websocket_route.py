"""
WebSocket route for real-time live audio detection.
The browser streams audio chunks; we analyze each and push results back.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import base64

from database.connection import get_db
from utils.predictor import run_prediction
from utils.auth import decode_token

router = APIRouter()


@router.websocket("/live/{token}")
async def live_detection(websocket: WebSocket, token: str):
    """
    WebSocket endpoint for live mic streaming.

    Protocol:
      Client → Server: JSON { "type": "chunk", "data": "<base64-audio-bytes>" }
      Server → Client: JSON { "type": "result", "result": {...} }
      Client → Server: JSON { "type": "stop" }
    """
    await websocket.accept()

    # Authenticate via token passed in URL
    try:
        payload = decode_token(token)
        email   = payload.get("sub")
        db      = get_db()
        user    = await db.users.find_one({"email": email})
        if not user:
            await websocket.send_json({"type": "error", "message": "Unauthorized"})
            await websocket.close()
            return
    except Exception:
        await websocket.send_json({"type": "error", "message": "Invalid token"})
        await websocket.close()
        return

    await websocket.send_json({"type": "connected", "message": "Live detection started"})

    chunk_buffer = bytearray()
    CHUNK_COUNT  = 0          # count of 3-second webm chunks received
    ANALYZE_EVERY = 1         # analyze every chunk (each chunk is ~3 sec of audio)

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "stop":
                await websocket.send_json({"type": "stopped", "message": "Session ended"})
                break

            if msg.get("type") == "chunk":
                # Decode base64 audio chunk (webm/opus compressed, NOT raw PCM)
                audio_bytes = base64.b64decode(msg["data"])
                chunk_buffer.extend(audio_bytes)
                CHUNK_COUNT += 1

                # Analyze every chunk (~3 seconds of audio per chunk)
                if CHUNK_COUNT % ANALYZE_EVERY == 0 and len(chunk_buffer) > 1024:
                    chunk_to_analyze = bytes(chunk_buffer)
                    chunk_buffer.clear()

                    try:
                        result = run_prediction(chunk_to_analyze, frame_selection="tail")

                        # Save to DB
                        detection_doc = {
                            "user_id":    user["_id"],
                            "file_name":  "Live Recording",
                            "source":     "live",
                            "is_scam":    result["is_scam"],
                            "label":      result["label"],
                            "confidence": result["confidence"],
                            "risk_level": result["risk_level"],
                            "explanation": result["explanation"],
                            "duration":   result["duration"],
                            "raw_score":  result["raw_score"],
                            "created_at": datetime.utcnow(),
                        }
                        inserted = await db.detections.insert_one(detection_doc)

                        # Update user stats
                        upd = {"$inc": {"total_scans": 1}}
                        if result["is_scam"]:
                            upd["$inc"]["scams_detected"] = 1
                        await db.users.update_one({"_id": user["_id"]}, upd)

                        await websocket.send_json({
                            "type":         "result",
                            "detection_id": str(inserted.inserted_id),
                            "result":       {k: v for k, v in result.items() if k != "spectrogram"},
                        })

                    except Exception as e:
                        await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
