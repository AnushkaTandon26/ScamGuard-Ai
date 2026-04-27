import React from "react";
import Layout from "../components/common/Layout";
import FileUploader from "../components/detection/FileUploader";
import { MdInfo } from "react-icons/md";

export default function UploadPage() {
  return (
    <Layout title="Upload Analysis" subtitle="Upload audio to detect fake or AI-generated voices">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-start gap-3 bg-blue-600/10 border border-blue-500/20 rounded-xl p-4">
          <MdInfo size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-0.5">Supported Formats</p>
            <p className="text-blue-400/80">
              Upload WAV, MP3, OGG, FLAC, or WebM files up to 50MB. For best results,
              use clear recordings with minimal background noise. The AI extracts voice features
              and classifies them as fake voice or real human voice using a CNN-Conformer deep learning model.
            </p>
          </div>
        </div>
        <FileUploader />
      </div>
    </Layout>
  );
}
