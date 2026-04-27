"""
Admin routes: system stats, manage users, all detections
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from bson import ObjectId
from datetime import datetime, timedelta

from database.connection import get_db
from utils.auth import get_admin_user

router = APIRouter()


def serialize(doc):
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id", ""))
    doc.pop("password", None)
    for k in ["user_id"]:
        if k in doc:
            doc[k] = str(doc[k])
    return doc


@router.get("/stats")
async def admin_stats(_=Depends(get_admin_user)):
    db = get_db()
    total_users      = await db.users.count_documents({})
    total_detections = await db.detections.count_documents({})
    total_scams      = await db.detections.count_documents({"is_scam": True})
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)
    today_scans      = await db.detections.count_documents({"created_at": {"$gte": today}})

    # New users this week
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_week = await db.users.count_documents({"created_at": {"$gte": week_ago}})

    return {
        "total_users":      total_users,
        "total_detections": total_detections,
        "total_scams":      total_scams,
        "today_scans":      today_scans,
        "new_users_week":   new_users_week,
        "scam_rate": round(total_scams / total_detections * 100, 1) if total_detections else 0,
    }


@router.get("/users")
async def list_users(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _=Depends(get_admin_user),
):
    db     = get_db()
    total  = await db.users.count_documents({})
    cursor = db.users.find({}).skip((page - 1) * limit).limit(limit)
    users  = [serialize(u) async for u in cursor]
    return {"items": users, "total": total, "page": page}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, _=Depends(get_admin_user)):
    db = get_db()
    await db.users.delete_one({"_id": ObjectId(user_id)})
    await db.detections.delete_many({"user_id": ObjectId(user_id)})
    return {"message": "User and associated data deleted"}


@router.get("/detections")
async def all_detections(
    page:  int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    _=Depends(get_admin_user),
):
    db     = get_db()
    total  = await db.detections.count_documents({})
    cursor = db.detections.find({}).sort("created_at", -1).skip((page - 1) * limit).limit(limit)
    docs   = [serialize(d) async for d in cursor]
    return {"items": docs, "total": total, "page": page}


@router.put("/users/{user_id}/role")
async def change_role(user_id: str, body: dict, _=Depends(get_admin_user)):
    role = body.get("role", "user")
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'admin'")
    db = get_db()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"role": role}})
    return {"message": f"Role updated to {role}"}
