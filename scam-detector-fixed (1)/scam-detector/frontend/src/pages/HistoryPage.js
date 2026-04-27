import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdDelete, MdDownload, MdFilterList, MdRefresh,
  MdWarning, MdCheckCircle, MdHistory, MdDeleteSweep,
} from "react-icons/md";
import Layout from "../components/common/Layout";
import { historyAPI, reportsAPI } from "../utils/api";
import toast from "react-hot-toast";

const FILTERS = [
  { label: "All",     value: "all"     },
  { label: "Scam",    value: "scam"    },
  { label: "Genuine", value: "genuine" },
];

function RiskBadge({ level }) {
  const cls = level === "High" ? "badge-high" : level === "Medium" ? "badge-medium" : "badge-low";
  return <span className={cls}>{level}</span>;
}

export default function HistoryPage() {
  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async (p = page, f = filter) => {
    setLoading(true);
    try {
      const res = await historyAPI.getHistory(p, 10, f);
      setItems(res.data.items);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchHistory(1, filter); setPage(1); }, [filter]);
  useEffect(() => { fetchHistory(page, filter); }, [page]);

  const handleDelete = async (id) => {
    try {
      await historyAPI.deleteOne(id);
      toast.success("Record deleted");
      fetchHistory(page, filter);
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL history? This cannot be undone.")) return;
    try {
      await historyAPI.clearAll();
      toast.success("All history cleared");
      fetchHistory(1, filter);
    } catch {
      toast.error("Clear failed");
    }
  };

  const handleDownload = async (id) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf" });
      await reportsAPI.downloadPDF(id);
      toast.success("Downloaded!", { id: "pdf" });
    } catch {
      toast.error("Download failed", { id: "pdf" });
    }
  };

  return (
    <Layout title="Call History" subtitle={`${total} total detection${total !== 1 ? "s" : ""}`}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-xl p-1">
            {FILTERS.map(({ label, value }) => (
              <button key={value} onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${filter === value ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => fetchHistory(page, filter)} className="btn-secondary text-sm">
              <MdRefresh size={16} /> Refresh
            </button>
            {items.length > 0 && (
              <button onClick={handleClearAll} className="btn-danger text-sm">
                <MdDeleteSweep size={16} /> Clear All
              </button>
            )}
          </div>
        </div>

        {/* Table card */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <MdHistory size={48} className="mb-3 opacity-30" />
              <p className="font-medium">No detections found</p>
              <p className="text-sm mt-1">Start analyzing calls to see history here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/80 border-b border-slate-700">
                  <tr>
                    {["File / Source", "Result", "Confidence", "Risk", "Duration", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.tr key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-slate-700/20 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {item.is_scam
                              ? <MdWarning size={16} className="text-red-400 flex-shrink-0" />
                              : <MdCheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                            <div>
                              <p className="text-slate-200 truncate max-w-[160px]">
                                {item.file_name || "Live Recording"}
                              </p>
                              <p className="text-slate-500 text-xs capitalize">{item.source}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={item.is_scam ? "badge-scam" : "badge-genuine"}>{item.label}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${item.is_scam ? "bg-red-500" : "bg-green-500"}`}
                                style={{ width: `${item.confidence}%` }}
                              />
                            </div>
                            <span className="text-slate-300 text-xs">{item.confidence}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4"><RiskBadge level={item.risk_level} /></td>
                        <td className="px-5 py-4 text-slate-400 text-xs">{item.duration}s</td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                          <br />
                          {new Date(item.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDownload(item.id)}
                              title="Download PDF Report"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                                         hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                              <MdDownload size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              title="Delete"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                                         hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all
                    ${p === page ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}>
                  {p}
                </button>
              ))}
            </div>
            <button disabled={page === pages} onClick={() => setPage(page + 1)}
              className="btn-secondary text-sm disabled:opacity-40">Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
