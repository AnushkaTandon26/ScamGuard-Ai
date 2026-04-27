import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  MdShield, MdWarning, MdCheckCircle, MdTrendingUp,
  MdHistory, MdMic, MdUploadFile,
} from "react-icons/md";
import { Link } from "react-router-dom";
import Layout from "../components/common/Layout";
import StatCard from "../components/dashboard/StatCard";
import { historyAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const RISK_COLORS = { High: "#ef4444", Medium: "#f59e0b", Low: "#22c55e" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user }              = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    historyAPI.getAnalytics()
      .then((r) => setAnalytics(r.data))
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const riskPieData = analytics
    ? Object.entries(analytics.risk_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Layout title="Dashboard" subtitle={`Welcome back, ${user?.username || "User"} 👋`}>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/live">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="card border border-red-500/20 hover:border-red-500/40 cursor-pointer
                           bg-gradient-to-br from-red-900/20 to-slate-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <MdMic size={26} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Live Detection</p>
                    <p className="text-slate-400 text-xs">Analyze call in real time</p>
                  </div>
                </div>
              </motion.div>
            </Link>
            <Link to="/upload">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="card border border-blue-500/20 hover:border-blue-500/40 cursor-pointer
                           bg-gradient-to-br from-blue-900/20 to-slate-800 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <MdUploadFile size={26} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Upload Analysis</p>
                    <p className="text-slate-400 text-xs">Analyze a recorded call</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Scans"     value={analytics?.total_scans   ?? 0} icon={MdShield}       color="blue"  />
            <StatCard title="Scams Detected"  value={analytics?.scam_count    ?? 0} icon={MdWarning}      color="red"   />
            <StatCard title="Genuine Calls"   value={analytics?.genuine_count ?? 0} icon={MdCheckCircle}  color="green" />
            <StatCard title="Scam Rate"       value={`${analytics?.scam_rate ?? 0}%`} icon={MdTrendingUp} color="yellow" />
          </div>

          {/* ── Charts row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Weekly area chart */}
            <div className="card lg:col-span-2">
              <h3 className="text-base font-semibold text-white mb-4">Weekly Activity</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={analytics?.daily_chart ?? []} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="scamGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#totalGrad)"
                        strokeWidth={2} name="Total" dot={{ fill: "#3b82f6", r: 3 }} />
                  <Area type="monotone" dataKey="scams" stroke="#ef4444" fill="url(#scamGrad)"
                        strokeWidth={2} name="Scams" dot={{ fill: "#ef4444", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Risk pie chart */}
            <div className="card">
              <h3 className="text-base font-semibold text-white mb-4">Risk Breakdown</h3>
              {riskPieData.every((d) => d.value === 0) ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={riskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                         paddingAngle={4} dataKey="value">
                      {riskPieData.map((entry) => (
                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: "#f1f5f9" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Recent detections ── */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">Recent Detections</h3>
              <Link to="/history" className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1">
                <MdHistory size={16} /> View All
              </Link>
            </div>

            {!analytics?.recent_detections?.length ? (
              <div className="text-center py-10 text-slate-500">
                <MdShield size={40} className="mx-auto mb-2 opacity-30" />
                <p>No detections yet. Start by analyzing a call!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {["File", "Result", "Confidence", "Risk", "Date"].map((h) => (
                        <th key={h} className="text-left pb-3 pr-4 text-slate-400 font-medium text-xs uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {analytics.recent_detections.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="py-3 pr-4 text-slate-300 max-w-[140px] truncate">
                          {d.file_name || "Live Recording"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={d.is_scam ? "badge-scam" : "badge-genuine"}>
                            {d.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-slate-300">{d.confidence}%</td>
                        <td className="py-3 pr-4">
                          <span className={
                            d.risk_level === "High" ? "badge-high" :
                            d.risk_level === "Medium" ? "badge-medium" : "badge-low"
                          }>{d.risk_level}</span>
                        </td>
                        <td className="py-3 text-slate-500 text-xs">
                          {new Date(d.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
