import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  MdPeople, MdShield, MdWarning, MdToday,
  MdDelete, MdAdminPanelSettings, MdRefresh, MdSupervisorAccount,
} from "react-icons/md";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Layout from "../components/common/Layout";
import StatCard from "../components/dashboard/StatCard";
import { adminAPI } from "../utils/api";
import toast from "react-hot-toast";

export default function AdminPage() {
  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [detections, setDetections] = useState([]);
  const [tab,        setTab]        = useState("overview"); // overview | users | detections
  const [loading,    setLoading]    = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, d] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getDetections(),
      ]);
      setStats(s.data);
      setUsers(u.data.items);
      setDetections(d.data.items);
    } catch {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleDeleteUser = async (id, email) => {
    if (!window.confirm(`Delete user ${email} and all their data?`)) return;
    try {
      await adminAPI.deleteUser(id);
      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await adminAPI.changeRole(id, newRole);
      toast.success(`Role updated to ${newRole}`);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: newRole } : u));
    } catch {
      toast.error("Role change failed");
    }
  };

  const TABS = ["overview", "users", "detections"];

  return (
    <Layout title="Admin Panel" subtitle="System administration and monitoring">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">

          {/* Tabs */}
          <div className="flex items-center gap-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all
                  ${tab === t ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"}`}>
                {t}
              </button>
            ))}
            <button onClick={loadAll} className="btn-secondary text-sm ml-auto">
              <MdRefresh size={16} /> Refresh
            </button>
          </div>

          {/* ── Overview ── */}
          {tab === "overview" && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Users"      value={stats.total_users}      icon={MdPeople}              color="blue"  />
                <StatCard title="Total Scans"      value={stats.total_detections} icon={MdShield}              color="green" />
                <StatCard title="Scams Detected"   value={stats.total_scams}      icon={MdWarning}             color="red"   />
                <StatCard title="Today's Scans"    value={stats.today_scans}      icon={MdToday}               color="yellow"/>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-base font-semibold text-white mb-4">System Overview</h3>
                  <div className="space-y-3">
                    {[
                      { label: "New users this week", value: stats.new_users_week, color: "text-blue-400"  },
                      { label: "Overall scam rate",   value: `${stats.scam_rate}%`, color: "text-red-400"  },
                      { label: "Total detections",    value: stats.total_detections, color: "text-green-400" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-slate-700/40">
                        <span className="text-slate-400 text-sm">{label}</span>
                        <span className={`font-bold ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-base font-semibold text-white mb-4">Scam vs Genuine</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={[
                      { name: "Scam",    value: stats.total_scams },
                      { name: "Genuine", value: stats.total_detections - stats.total_scams },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12 }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── Users ── */}
          {tab === "users" && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {users.map((u) => (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center
                                            text-blue-400 font-bold text-sm flex-shrink-0">
                              {u.username?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-slate-200 font-medium">{u.username}</p>
                              <p className="text-slate-500 text-xs">{u.full_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-400">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                            ${u.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-slate-700 text-slate-300"}`}>
                            {u.role === "admin" ? "👑 Admin" : "User"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleRoleChange(u.id, u.role)}
                              title={u.role === "admin" ? "Remove admin" : "Make admin"}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                                         hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">
                              <MdSupervisorAccount size={16} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id, u.email)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400
                                         hover:text-red-400 hover:bg-red-500/10 transition-all">
                              <MdDelete size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── All Detections ── */}
          {tab === "detections" && (
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 border-b border-slate-700">
                    <tr>
                      {["File", "Result", "Confidence", "Risk", "Source", "Date"].map((h) => (
                        <th key={h} className="text-left px-5 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {detections.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-5 py-4 text-slate-300 truncate max-w-[150px]">{d.file_name || "Live"}</td>
                        <td className="px-5 py-4">
                          <span className={d.is_scam ? "badge-scam" : "badge-genuine"}>{d.label}</span>
                        </td>
                        <td className="px-5 py-4 text-slate-300">{d.confidence}%</td>
                        <td className="px-5 py-4">
                          <span className={d.risk_level === "High" ? "badge-high" : d.risk_level === "Medium" ? "badge-medium" : "badge-low"}>
                            {d.risk_level}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 capitalize">{d.source}</td>
                        <td className="px-5 py-4 text-slate-500 text-xs">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </Layout>
  );
}
