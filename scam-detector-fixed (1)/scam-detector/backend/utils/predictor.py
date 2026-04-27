"""
Prediction helpers for uploaded and live audio.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from utils.audio_processor import (
    audio_duration,
    estimate_synthetic_voice_score,
    load_audio,
    preprocess_audio,
)
from utils.model_loader import get_model


def _risk_level(score_percent: float) -> str:
    if score_percent >= 80:
        return "High"
    if score_percent >= 60:
        return "Medium"
    return "Low"


def _build_explanation(is_scam: bool, confidence: float, heuristic_score: float, used_model: bool) -> str:
    mode = "neural model" if used_model else "heuristic fallback"
    if is_scam:
        return (
            f"The {mode} found patterns often associated with synthetic or suspicious speech. "
            f"Estimated scam likelihood is {confidence:.1f}%, with a voice-stability signal of {heuristic_score:.2f}."
        )
    return (
        f"The {mode} did not find strong scam-like voice patterns. "
        f"Estimated scam likelihood is {confidence:.1f}%, with a voice-stability signal of {heuristic_score:.2f}."
    )


def run_prediction(file_bytes: bytes, frame_selection: str = "head") -> dict[str, Any]:
    """
    Run the best available prediction flow.

    If the TensorFlow model is unavailable, we fall back to a deterministic
    heuristic so the app remains usable.
    """
    audio, sr = load_audio(file_bytes)
    duration = round(float(audio_duration(audio, sr)), 1)
    heuristic_score = float(estimate_synthetic_voice_score(audio, sr))

    score = heuristic_score
    used_model = False

    model = get_model()
    if model is not None:
        try:
            features = preprocess_audio(audio, sr, frame_selection=frame_selection)
            raw = model.predict(features, verbose=0)
            model_score = float(np.squeeze(raw))
            score = float(np.clip((0.8 * model_score) + (0.2 * heuristic_score), 0.0, 1.0))
            used_model = True
        except Exception as exc:
            print(f"Warning: model inference failed, using heuristic fallback instead: {exc}")

    confidence = round(score * 100, 1)
    is_scam = score >= 0.5

    return {
        "is_scam": is_scam,
        "label": "FAKE VOICE" if is_scam else "REAL HUMAN VOICE",
        "confidence": confidence,
        "risk_level": _risk_level(confidence),
        "explanation": _build_explanation(is_scam, confidence, heuristic_score, used_model),
        "duration": duration,
        "raw_score": round(score, 4),
    }
