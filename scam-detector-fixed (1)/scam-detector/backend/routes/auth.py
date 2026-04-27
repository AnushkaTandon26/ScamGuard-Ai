"""
Authentication routes: register, login, get profile, update profile
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime
from bson import ObjectId

from database.connection import get_db
from utils.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str = ""

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UpdateProfileRequest(BaseModel):
    full_name: str = None
    username:  str = None


# ─── Helpers ─────────────────────────────────────────────────────────────────
def serialize_user(user: dict) -> dict:
    """Remove password and convert ObjectId for JSON response."""
    user = dict(user)
    user["id"] = str(user.pop("_id", ""))
    user.pop("password", None)
    return user


# ─── Routes ──────────────────────────────────────────────────────────────────
@router.post("/register")
async def register(data: RegisterRequest):
    db = get_db()

    # Check duplicates
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(status_code=400, detail="Username already taken")

    user_doc = {
        "username":   data.username,
        "email":      data.email,
        "password":   hash_password(data.password),
        "full_name":  data.full_name,
        "role":       "user",
        "created_at": datetime.utcnow(),
        "last_login": None,
        "total_scans": 0,
        "scams_detected": 0,
        "language": "en",
    }

    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    token = create_access_token({"sub": data.email})
    return {"token": token, "user": serialize_user(user_doc), "message": "Account created successfully"}


@router.post("/login")
async def login(data: LoginRequest):
    db   = get_db()
    user = await db.users.find_one({"email": data.email})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Update last login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )

    token = create_access_token({"sub": data.email})
    return {"token": token, "user": serialize_user(user), "message": "Login successful"}


@router.get("/me")
async def get_profile(current_user=Depends(get_current_user)):
    return serialize_user(current_user)


@router.put("/me")
async def update_profile(data: UpdateProfileRequest, current_user=Depends(get_current_user)):
    db      = get_db()
    updates = {k: v for k, v in data.dict().items() if v is not None}
    if updates:
        await db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": updates}
        )
    updated = await db.users.find_one({"_id": current_user["_id"]})
    return {"user": serialize_user(updated), "message": "Profile updated"}


@router.post("/change-password")
async def change_password(
    data: dict,
    current_user=Depends(get_current_user)
):
    db = get_db()
    if not verify_password(data.get("current_password", ""), current_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    new_hash = hash_password(data["new_password"])
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": {"password": new_hash}}
    )
    return {"message": "Password updated successfully"}
