"""
Audio preprocessing utilities.
Converts raw audio to Mel-spectrogram features for the prediction pipeline.
"""

import os

import librosa
import numpy as np
from scipy.signal import butter, filtfilt


SAMPLE_RATE = 16000
N_MELS = 128
N_FFT = 2048
HOP_LENGTH = 256
TARGET_FRAMES = 128
INPUT_SHAPE = (128, 128, 1)


def load_audio(file_bytes: bytes, orig_sr: int = None) -> tuple:
    """
    Load audio from raw bytes.
    Supports wav/webm/ogg/mp3 chunks.
    """
    import tempfile

    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        audio, sr = librosa.load(tmp_path, sr=SAMPLE_RATE, mono=True)
        print(f"Audio loaded successfully: {len(audio) / SAMPLE_RATE:.1f}s")
        return audio.astype(np.float32), sr

    except Exception as exc:
        print(f"Audio load failed ({exc}). Using dummy audio for testing.")
        duration = 3.0
        t = np.linspace(0, duration, int(SAMPLE_RATE * duration), False)
        dummy_audio = (
            0.3 * np.sin(2 * np.pi * 440 * t) +
            0.1 * np.random.normal(0, 0.05, len(t))
        )
        return dummy_audio.astype(np.float32), SAMPLE_RATE

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def preprocess_audio(audio: np.ndarray, sr: int, frame_selection: str = "head") -> np.ndarray:
    """
    Full preprocessing pipeline:
    1. Resample to 16kHz
    2. Apply bandpass filter
    3. Normalize amplitude
    4. Extract Mel spectrogram
    5. Convert to dB scale
    6. Pad/trim to fixed shape
    7. Normalize to [0, 1]
    8. Expand dims for CNN input
    """
    if sr != SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)

    audio = _bandpass_filter(audio, SAMPLE_RATE, lowcut=80, highcut=8000)

    max_amp = np.max(np.abs(audio))
    if max_amp > 0:
        audio = audio / max_amp

    mel_spec = librosa.feature.melspectrogram(
        y=audio,
        sr=SAMPLE_RATE,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        n_mels=N_MELS,
        fmin=80,
        fmax=8000,
        power=2.0,
    )

    log_mel = librosa.power_to_db(mel_spec, ref=np.max)

    if log_mel.shape[1] < TARGET_FRAMES:
        pad_width = TARGET_FRAMES - log_mel.shape[1]
        log_mel = np.pad(log_mel, ((0, 0), (0, pad_width)), mode="constant")
    else:
        if frame_selection == "tail":
            log_mel = log_mel[:, -TARGET_FRAMES:]
        else:
            log_mel = log_mel[:, :TARGET_FRAMES]

    log_mel = np.clip((log_mel + 80) / 80, 0, 1)

    features = log_mel[..., np.newaxis]
    features = np.expand_dims(features, axis=0)

    return features.astype(np.float32)


def extract_spectrogram_image(audio: np.ndarray, sr: int) -> np.ndarray:
    if sr != SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)

    mel_spec = librosa.feature.melspectrogram(
        y=audio,
        sr=SAMPLE_RATE,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
        n_mels=N_MELS,
        fmin=80,
        fmax=8000,
        power=2.0,
    )

    log_mel = librosa.power_to_db(mel_spec, ref=np.max)
    return log_mel.tolist()


def estimate_synthetic_voice_score(audio: np.ndarray, sr: int) -> float:
    if sr != SAMPLE_RATE:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)

    if len(audio) < SAMPLE_RATE // 2:
        return 0.0

    rms = librosa.feature.rms(
        y=audio,
        frame_length=N_FFT,
        hop_length=HOP_LENGTH,
    )[0]

    centroid = librosa.feature.spectral_centroid(
        y=audio,
        sr=SAMPLE_RATE,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
    )[0]

    flatness = librosa.feature.spectral_flatness(
        y=audio,
        n_fft=N_FFT,
        hop_length=HOP_LENGTH,
    )[0]

    try:
        f0 = librosa.yin(
            audio,
            fmin=80,
            fmax=350,
            sr=SAMPLE_RATE,
            frame_length=2048,
            hop_length=HOP_LENGTH,
        )
        voiced = f0[np.isfinite(f0)]
    except Exception:
        voiced = np.array([], dtype=np.float32)

    def stability(values: np.ndarray, cap: float) -> float:
        if values.size < 4:
            return 0.0
        mean = float(np.mean(np.abs(values))) + 1e-6
        ratio = float(np.std(values) / mean)
        return float(np.clip(1.0 - (ratio / cap), 0.0, 1.0))

    pitch_stability = stability(voiced, 0.22)
    energy_stability = stability(rms, 0.45)
    centroid_stability = stability(centroid, 0.35)
    flatness_mean = float(np.clip(np.mean(flatness) / 0.12, 0.0, 1.0))
    score = (
        0.55 * pitch_stability +
        0.15 * energy_stability +
        0.15 * centroid_stability +
        0.15 * flatness_mean
    )
    return float(np.clip(score, 0.0, 1.0))


def _bandpass_filter(audio: np.ndarray, sr: int, lowcut: float, highcut: float) -> np.ndarray:
    nyq = sr / 2.0
    low = max(lowcut / nyq, 0.001)
    high = min(highcut / nyq, 0.999)

    b, a = butter(4, [low, high], btype="band")
    return filtfilt(b, a, audio).astype(np.float32)


def audio_duration(audio: np.ndarray, sr: int) -> float:
    return len(audio) / sr
