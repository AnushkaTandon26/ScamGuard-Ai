"""
Seed script: creates a default admin user for first-time setup.
Run: python seed.py
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME",   "scam_detector")

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]

    admin_email = "admin@scamguard.ai"

    existing = await db.users.find_one({"email": admin_email})
    if existing:
        print(f"⚠️  Admin already exists: {admin_email}")
        client.close()
        return

    admin_doc = {
        "username":       "admin",
        "email":          admin_email,
        "password":       pwd_ctx.hash("admin123"),
        "full_name":      "ScamGuard Admin",
        "role":           "admin",
        "created_at":     datetime.utcnow(),
        "last_login":     None,
        "total_scans":    0,
        "scams_detected": 0,
        "language":       "en",
    }

    await db.users.insert_one(admin_doc)
    print("✅ Admin user created:")
    print(f"   Email:    {admin_email}")
    print(f"   Password: admin123")
    print("   ⚠️  Change the password after first login!")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
