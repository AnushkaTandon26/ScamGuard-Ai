"""
Model loader that keeps a singleton reference to the trained network.
"""

from pathlib import Path
import os

import numpy as np
from dotenv import load_dotenv

try:
    import tensorflow as tf
except ImportError:
    tf = None

load_dotenv()

_model = None
BACKEND_DIR = Path(__file__).resolve().parent.parent


def build_cnn_conformer(input_shape=(128, 128, 1)):
    from tensorflow.keras import Model, layers

    inputs = tf.keras.Input(shape=input_shape)

    x = layers.Conv2D(32, (3, 3), activation="relu", padding="same")(inputs)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Conv2D(64, (3, 3), activation="relu", padding="same")(x)
    x = layers.MaxPooling2D((2, 2))(x)

    shape = x.shape
    x = layers.Reshape((shape[1] * shape[2], shape[3]))(x)

    attn_out = layers.MultiHeadAttention(num_heads=4, key_dim=64)(x, x)
    x = layers.LayerNormalization()(layers.Add()([x, attn_out]))

    ff = layers.Dense(128, activation="relu")(x)
    ff = layers.Dense(64)(ff)
    x = layers.LayerNormalization()(layers.Add()([x, ff]))

    x = layers.Conv1D(64, 3, activation="relu", padding="same")(x)
    x = layers.GlobalAveragePooling1D()(x)
    outputs = layers.Dense(1, activation="sigmoid")(x)

    return Model(inputs, outputs)


def load_model_on_startup():
    """Load the model once during app startup."""
    global _model
    configured_path = os.getenv("MODEL_PATH")
    model_path = Path(configured_path) if configured_path else BACKEND_DIR / "model" / "cnn_conformer.h5"

    if tf is None:
        print("Warning: TensorFlow is not installed. Using heuristic prediction mode.")
        _model = None
        return

    if not model_path.exists():
        print(f"Warning: model file not found at {model_path}. Using heuristic prediction mode.")
        _model = None
        return

    try:
        _model = tf.keras.models.load_model(model_path)
        print(f"Model loaded from {model_path}")
    except Exception:
        try:
            _model = build_cnn_conformer(input_shape=(128, 128, 1))
            _model.load_weights(model_path, by_name=True, skip_mismatch=True)
            print(f"Model weights loaded from {model_path}")
        except Exception as exc:
            print(f"Warning: could not load model, using heuristic prediction mode: {exc}")
            _model = None


def get_model():
    return _model
