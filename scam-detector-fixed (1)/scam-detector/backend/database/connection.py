"""
Database connection helpers.

MongoDB is preferred, but the app can fall back to a local JSON-backed store
so development still works without extra infrastructure.
"""

import os

import motor.motor_asyncio
from dotenv import load_dotenv
from pymongo import ASCENDING, DESCENDING, IndexModel

from database.local_store import LocalDatabase

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "scam_detector")

client = None
db = None


async def connect_db():
    """Initialize MongoDB connection and fall back to local storage if needed."""
    global client, db
    client = None
    db = None

    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command("ping")
        db = client[DB_NAME]
    except Exception as exc:
        print(f"Warning: MongoDB unavailable, using local JSON database instead: {exc}")
        client = None
        db = LocalDatabase()

    await db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("username", ASCENDING)], unique=True),
    ])
    await db.detections.create_indexes([
        IndexModel([("user_id", ASCENDING)]),
        IndexModel([("created_at", DESCENDING)]),
        IndexModel([("is_scam", ASCENDING)]),
    ])
    return db


async def disconnect_db():
    """Close MongoDB connection when a remote client is in use."""
    global client
    if client:
        client.close()


def get_db():
    """Return the active database handle."""
    return db
