import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { MdCloudUpload, MdAudiotrack, MdClose, MdPlayArrow } from "react-icons/md";
import { detectionAPI } from "../../utils/api";
import ResultCard from "./ResultCard";
import toast from "react-hot-toast";

const ACCEPTED_TYPES = {
  "audio/wav": [".wav"], "audio/mpeg": [".mp3"],
  "audio/ogg": [".ogg"], "audio/flac": [".flac"],
  "audio/webm": [".webm"], "audio/x-m4a": [".m4a"],
};

export default function FileUploader() {
  const [file,        setFile]        = useState(null);
  const [preview,     setPreview]     = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [progress,    setProgress]    = useState(0);
  const [result,      setResult]      = useState(null);
  const [detectionId, setDetectionId] = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) { toast.error("Invalid file type. Use WAV, MP3, OGG, FLAC, or WebM."); return; }
    const f = accepted[0];
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setDetectionId(null);
    setProgress(0);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxFiles: 1, maxSize: 50 * 1024 * 1024,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await detectionAPI.uploadFile(formData, setProgress);
      setResult(res.data.result);
      setDetectionId(res.data.detection_id);
      toast.success("Analysis complete!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Analysis failed");
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setDetectionId(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-1">Upload Audio File</h2>
        <p className="text-slate-400 text-sm mb-6">
          Upload a recorded call to analyze it for scam indicators. Supports WAV, MP3, OGG, FLAC, WebM.
        </p>

        {/* Drop zone */}
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-600 hover:border-slate-500 hover:bg-slate-800/60"
              }`}
          >
            <input {...getInputProps()} />
            <motion.div
              animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                ${isDragActive ? "bg-blue-600" : "bg-slate-700"}`}>
                <MdCloudUpload size={32} className={isDragActive ? "text-white" : "text-slate-400"} />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">
                  {isDragActive ? "Drop it here!" : "Drag & drop audio file"}
                </p>
                <p className="text-slate-500 text-sm mt-1">or click to browse (max 50MB)</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {["WAV", "MP3", "OGG", "FLAC", "WebM"].map((ext) => (
                  <span key={ext} className="bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-lg">
                    .{ext.toLowerCase()}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* File preview */
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/60 rounded-2xl p-5 border border-slate-700/60"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <MdAudiotrack size={22} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm truncate max-w-xs">{file.name}</p>
                    <p className="text-slate-500 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={clearFile} className="text-slate-500 hover:text-red-400 transition-colors">
                  <MdClose size={20} />
                </button>
              </div>

              {/* Audio player */}
              {preview && (
                <audio controls className="w-full h-10 mb-4" src={preview}>
                  Your browser does not support audio.
                </audio>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Uploading & analyzing...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Analyze button */}
              {!result && (
                <button
                  onClick={handleAnalyze}
                  disabled={uploading}
                  className="btn-primary w-full justify-center text-base py-3"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <><MdPlayArrow size={20} /> Analyze Audio</>
                  )}
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Result */}
      {result && <ResultCard result={result} detectionId={detectionId} />}
    </div>
  );
}
