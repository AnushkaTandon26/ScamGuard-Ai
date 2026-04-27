import React from "react";
import { motion } from "framer-motion";
import { MdWarning, MdCheckCircle, MdDownload, MdInfo } from "react-icons/md";
import { reportsAPI } from "../../utils/api";
import toast from "react-hot-toast";
import { normalizeDetection } from "../../utils/normalizeDetection";

// Confidence ring using SVG
function ConfidenceRing({ value, color }) {
  const r  = 40;
  const cx = 52;
  const cy = 52;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg width="104" height="104" className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#334155" strokeWidth={strokeWidth} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
        />
      </svg>
      <span className="absolute text-xl font-bold text-white">{value}%</span>
    </div>
  );
}

const RISK_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

export default function ResultCard({ result, detectionId }) {
  if (!result) return null;

  const normalized = normalizeDetection(result);
  const { is_scam, confidence, risk_level, explanation, duration } = normalized;
  const mainColor  = is_scam ? "#ef4444" : "#22c55e";
  const riskColor  = RISK_COLORS[risk_level] || "#64748b";

  const handleDownload = async () => {
    if (!detectionId) { toast.error("No detection ID — save detection first"); return; }
    try {
      toast.loading("Generating PDF...", { id: "pdf" });
      await reportsAPI.downloadPDF(detectionId);
      toast.success("Report downloaded!", { id: "pdf" });
    } catch {
      toast.error("Failed to download report", { id: "pdf" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`card border-2 ${is_scam ? "border-red-500/40" : "border-green-500/40"} animate-fade-in`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
            ${is_scam ? "bg-red-500/20" : "bg-green-500/20"}`}>
            {is_scam
              ? <MdWarning size={28} color="#ef4444" />
              : <MdCheckCircle size={28} color="#22c55e" />}
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${is_scam ? "text-red-400" : "text-green-400"}`}>
              {is_scam ? "FAKE VOICE DETECTED" : "REAL HUMAN VOICE"}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">AI Analysis Complete</p>
          </div>
        </div>
        <button onClick={handleDownload} className="btn-secondary text-sm">
          <MdDownload size={16} /> PDF Report
        </button>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Confidence ring */}
        <div className="flex flex-col items-center gap-2 bg-slate-900/60 rounded-xl p-4">
          <ConfidenceRing value={Math.round(confidence)} color={mainColor} />
          <span className="text-slate-400 text-xs font-medium">Confidence</span>
        </div>

        {/* Risk level */}
        <div className="flex flex-col items-center justify-center gap-3 bg-slate-900/60 rounded-xl p-4">
          <div className="text-5xl font-black" style={{ color: riskColor }}>
            {risk_level}
          </div>
          <span className="text-slate-400 text-xs font-medium">Fake Voice Risk</span>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: risk_level === "High" ? "100%" : risk_level === "Medium" ? "60%" : "25%" }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="h-full rounded-full"
              style={{ backgroundColor: riskColor }}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col items-center justify-center gap-2 bg-slate-900/60 rounded-xl p-4">
          <span className="text-4xl font-black text-blue-400">{duration}s</span>
          <span className="text-slate-400 text-xs font-medium">Audio Duration</span>
        </div>
      </div>

      {/* AI Explanation */}
      <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-700/60">
        <div className="flex items-center gap-2 mb-2">
          <MdInfo size={16} className="text-blue-400" />
          <span className="text-sm font-semibold text-slate-300">AI Reasoning</span>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed">{explanation}</p>
      </div>
    </motion.div>
  );
}
