import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdMic, MdStop } from "react-icons/md";
import { detectionAPI } from "../../utils/api";
import ResultCard from "./ResultCard";
import toast from "react-hot-toast";
import { normalizeDetection } from "../../utils/normalizeDetection";

function Waveform({ active }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          animate={
            active
              ? { height: ["4px", `${Math.floor(Math.random() * 24 + 6)}px`, "4px"] }
              : { height: "4px" }
          }
          transition={
            active
              ? { duration: 0.5 + Math.random() * 0.4, repeat: Infinity, delay: i * 0.04, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className="w-1.5 bg-blue-400 rounded-full"
          style={{ minHeight: "4px" }}
        />
      ))}
    </div>
  );
}

export default function LiveRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [detectionId, setDetectionId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [liveLog, setLiveLog] = useState([]);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunkBufferRef = useRef([]);

  const teardown = useCallback(() => {
    clearInterval(timerRef.current);
    chunkBufferRef.current = [];
    try {
      if (recorderRef.current?.state !== "inactive") recorderRef.current.stop();
    } catch {}
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch {}
    setIsRecording(false);
    setStatus("idle");
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const appendLiveResult = useCallback((liveResult, id) => {
    const normalized = normalizeDetection(liveResult);
    setDetectionId(id ?? null);
    setResult(normalized);
    setLiveLog((prev) => [
      {
        ...normalized,
        ts: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev,
    ]);
  }, []);

  const startRecording = useCallback(async () => {
    setStatus("connecting");
    setResult(null);
    setDetectionId(null);
    setLiveLog([]);
    setElapsed(0);
    chunkBufferRef.current = [];

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (err) {
      toast.error(
        err.name === "NotAllowedError"
          ? "Microphone access denied. Please allow it in browser settings."
          : `Microphone error: ${err.message}`
      );
      setStatus("idle");
      return;
    }

    streamRef.current = stream;

    try {
      const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/wav", ""].find(
        (type) => type === "" || MediaRecorder.isTypeSupported(type)
      );

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;

      recorder.ondataavailable = async (event) => {
        if (event.data.size < 256) return;

        chunkBufferRef.current.push(event.data);

        const combinedBlob = new Blob(chunkBufferRef.current, {
          type: event.data.type || "audio/webm",
        });

        const formData = new FormData();
        formData.append("file", combinedBlob, "live_chunk.webm");

        try {
          const res = await detectionAPI.sendLiveChunk(formData);
          const data = res.data;

          if (data.status === "too_short") return;
          if (data.result) appendLiveResult(data.result, data.detection_id);
        } catch (err) {
          console.error("Live chunk analysis failed:", err);
          toast.error(err.response?.data?.detail || "Live analysis failed");
        }
      };

      recorder.onerror = (event) => {
        toast.error(`MediaRecorder error: ${event.error?.message || "unknown"}`);
        teardown();
      };

      recorder.start(3000);
      setIsRecording(true);
      setStatus("recording");
      toast.success("Recording started. Live analysis is running.");
      timerRef.current = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast.error(`Failed to start live recording: ${err.message}`);
      stream.getTracks().forEach((track) => track.stop());
      setStatus("idle");
    }
  }, [appendLiveResult, teardown]);

  const stopRecording = useCallback(() => {
    teardown();
  }, [teardown]);

  const fmt = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-1">Live Fake Voice Detection</h2>
        <p className="text-slate-400 text-sm mb-4">
          Press <strong>Start Recording</strong>, then hold your phone near the speaker.
          The AI analyzes the latest audio every 3 seconds to detect fake or AI-generated voices.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 bg-slate-900 rounded-lg px-3 py-2 border border-slate-700 text-xs font-mono text-slate-500 break-all">
            Live endpoint: POST /api/detection/live
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="bg-slate-900/60 rounded-2xl px-8 py-6 border border-slate-700/60">
            <Waveform active={isRecording} />
          </div>
        </div>

        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 mb-5"
            >
              <span className="w-3 h-3 bg-red-500 rounded-full recording-pulse" />
              <span className="font-mono text-3xl font-bold text-white tabular-nums">{fmt(elapsed)}</span>
              <span className="text-slate-400 text-sm font-medium tracking-widest">LIVE</span>
            </motion.div>
          )}
        </AnimatePresence>

        {status === "connecting" && (
          <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400 text-sm">
            <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            Preparing microphone...
          </div>
        )}

        <div className="flex justify-center">
          {!isRecording ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={status === "connecting"}
              className="flex items-center gap-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all shadow-lg shadow-red-900/40"
            >
              <MdMic size={26} />
              {status === "connecting" ? "Connecting..." : "Start Recording"}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="flex items-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-bold px-10 py-4 rounded-2xl text-lg transition-all"
            >
              <MdStop size={26} />
              Stop Recording
            </motion.button>
          )}
        </div>
      </div>

      {result && <ResultCard result={result} detectionId={detectionId} />}

      {liveLog.length > 0 && (
        <div className="card">
          <h3 className="text-base font-semibold text-slate-300 mb-3">
            Session Log
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({liveLog.length} chunk{liveLog.length !== 1 ? "s" : ""} analyzed)
            </span>
          </h3>
          <div className="space-y-2">
            {liveLog.map((entry, index) => (
              <motion.div
                key={`${entry.ts}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-700/40"
              >
                <span className={`font-semibold text-sm ${entry.is_scam ? "text-red-400" : "text-green-400"}`}>
                  {entry.is_scam ? "Fake Voice" : "Real Voice"}
                </span>
                <span className="text-slate-400 text-sm">{entry.confidence}%</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    entry.risk_level === "High"
                      ? "badge-high"
                      : entry.risk_level === "Medium"
                        ? "badge-medium"
                        : "badge-low"
                  }`}
                >
                  {entry.risk_level}
                </span>
                <span className="text-slate-600 text-xs font-mono">{entry.ts}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
