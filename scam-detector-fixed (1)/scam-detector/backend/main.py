"""
AI Voice Scam Detection System - FastAPI backend entry point.
"""

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database.connection import connect_db, disconnect_db
from routes import admin, auth, detection, history, reports, websocket_route
from utils.model_loader import get_model, load_model_on_startup


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    load_model_on_startup()
    print("Database connected")
    print("AI model loaded" if get_model() is not None else "Using fallback prediction mode")
    yield
    await disconnect_db()
    print("Server shutting down")


app = FastAPI(
    title="AI Voice Scam Detection API",
    description="Detect scam calls using CNN-Conformer deep learning model",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(detection.router, prefix="/api/detection", tags=["Detection"])
app.include_router(history.router, prefix="/api/history", tags=["History"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(websocket_route.router, prefix="/ws", tags=["WebSocket"])


@app.get("/")
async def root():
    return {"message": "AI Voice Scam Detection API is running", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok", "model_loaded": get_model() is not None}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
