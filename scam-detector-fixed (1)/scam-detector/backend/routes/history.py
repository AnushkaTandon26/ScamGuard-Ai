"""
History routes: paginated call history, analytics, delete
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from bson import ObjectId

from database.connection import get_db
from utils.auth import get_current_user

router = APIRouter()


def serialize(doc: dict) -> dict:
    doc = dict(doc)
    doc["id"]      = str(doc.pop("_id", ""))
    doc["user_id"] = str(doc.get("user_id", ""))
    return doc


@router.get("/")
async def get_history(
    page:  int = Query(1,  ge=1),
    limit: int = Query(10, ge=1, le=100),
    filter: str = Query("all"),  # all | scam | genuine
    current_user = Depends(get_current_user),
):
    db    = get_db()
    query = {"user_id": current_user["_id"]}
    if filter == "scam":
        query["is_scam"] = True
    elif filter == "genuine":
        query["is_scam"] = False

    total  = await db.detections.count_documents(query)
    cursor = db.detections.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    docs   = [serialize(d) async for d in cursor]

    return {
        "items":      docs,
        "total":      total,
        "page":       page,
        "pages":      (total + limit - 1) // limit,
        "has_next":   page * limit < total,
        "has_prev":   page > 1,
    }


@router.get("/analytics")
async def get_analytics(current_user = Depends(get_current_user)):
    """Return aggregated stats for the current user's dashboard."""
    db    = get_db()
    uid   = current_user["_id"]

    total       = await db.detections.count_documents({"user_id": uid})
    scam_count  = await db.detections.count_documents({"user_id": uid, "is_scam": True})
    genuine     = total - scam_count
    scam_rate   = round((scam_count / total * 100), 1) if total else 0

    # Last 7 days daily breakdown
    daily = []
    for i in range(6, -1, -1):
        day_start = datetime.utcnow().replace(hour=0, minute=0, second=0) - timedelta(days=i)
        day_end   = day_start + timedelta(days=1)
        count     = await db.detections.count_documents({
            "user_id":    uid,
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        scams     = await db.detections.count_documents({
            "user_id":    uid,
            "is_scam":    True,
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        daily.append({
            "date":   day_start.strftime("%b %d"),
            "total":  count,
            "scams":  scams,
        })

    # Risk breakdown
    high   = await db.detections.count_documents({"user_id": uid, "risk_level": "High"})
    medium = await db.detections.count_documents({"user_id": uid, "risk_level": "Medium"})
    low    = await db.detections.count_documents({"user_id": uid, "risk_level": "Low"})

    # Recent 5
    cursor = db.detections.find({"user_id": uid}).sort("created_at", -1).limit(5)
    recent = [serialize(d) async for d in cursor]

    return {
        "total_scans":   total,
        "scam_count":    scam_count,
        "genuine_count": genuine,
        "scam_rate":     scam_rate,
        "daily_chart":   daily,
        "risk_breakdown": {"High": high, "Medium": medium, "Low": low},
        "recent_detections": recent,
    }


@router.delete("/{detection_id}")
async def delete_detection(detection_id: str, current_user = Depends(get_current_user)):
    db  = get_db()
    oid = ObjectId(detection_id)
    doc = await db.detections.find_one({"_id": oid})
    if not doc:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    if str(doc["user_id"]) != str(current_user["_id"]):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.detections.delete_one({"_id": oid})
    return {"message": "Deleted successfully"}


@router.delete("/")
async def clear_all_history(current_user = Depends(get_current_user)):
    db     = get_db()
    result = await db.detections.delete_many({"user_id": current_user["_id"]})
    return {"message": f"Deleted {result.deleted_count} records"}
