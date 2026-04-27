import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  MdDashboard, MdMic, MdUploadFile, MdHistory,
  MdAdminPanelSettings, MdSettings, MdLogout,
  MdShield, MdChevronLeft, MdChevronRight, MdBarChart,
} from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { to: "/dashboard", icon: MdDashboard,          key: "dashboard" },
  { to: "/live",      icon: MdMic,                key: "liveDetection" },
  { to: "/upload",    icon: MdUploadFile,          key: "uploadAnalysis" },
  { to: "/history",   icon: MdHistory,             key: "history" },
  { to: "/settings",  icon: MdSettings,            key: "settings" },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const items = isAdmin
    ? [...NAV_ITEMS, { to: "/admin", icon: MdAdminPanelSettings, key: "admin" }]
    : NAV_ITEMS;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-slate-900 border-r border-slate-700/60 overflow-hidden flex-shrink-0"
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 w-6 h-6 bg-slate-700 border border-slate-600
                   rounded-full flex items-center justify-center text-slate-400
                   hover:text-white hover:bg-slate-600 transition-all"
      >
        {collapsed ? <MdChevronRight size={14} /> : <MdChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-slate-700/60">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <MdShield className="text-white" size={20} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <p className="font-bold text-white text-sm leading-none">ScamGuard</p>
              <p className="text-blue-400 text-xs mt-0.5">AI Detection</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {items.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""} ${collapsed ? "justify-center px-2" : ""}`
            }
            title={collapsed ? t(`nav.${key}`) : undefined}
          >
            <Icon size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  {t(`nav.${key}`)}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* User profile + logout */}
      <div className="border-t border-slate-700/60 p-3">
        <div className={`flex items-center gap-3 mb-2 px-2 py-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
                          text-white font-semibold text-sm flex-shrink-0">
            {user?.username?.[0]?.toUpperCase() || "U"}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10
                      ${collapsed ? "justify-center px-2" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <MdLogout size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-sm font-medium">
                {t("nav.logout")}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
