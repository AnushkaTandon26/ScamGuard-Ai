import React from "react";
import Layout from "../components/common/Layout";
import LiveRecorder from "../components/detection/LiveRecorder";
import { MdInfo } from "react-icons/md";

export default function LiveDetectPage() {
  return (
    <Layout title="Live Fake Voice Detection" subtitle="Analyze audio in real time for AI-generated or cloned voices">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Info banner */}
        <div className="flex items-start gap-3 bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
          <MdInfo size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-0.5">How it works</p>
            <p className="text-blue-400/80">
              Allow microphone access, press <strong>Start Recording</strong>, then hold your phone
              near the speaker or play a sample. The AI analyzes recent audio every 3 seconds and tells you whether the voice sounds fake or human.
            </p>
          </div>
        </div>

        <LiveRecorder />
      </div>
    </Layout>
  );
}
