import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "blue", trend }) {
  const colorMap = {
    blue:   { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20" },
    red:    { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20" },
    green:  { bg: "bg-green-500/10",  text: "text-green-400",  border: "border-green-500/20" },
    yellow: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/20" },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`card border ${c.border} hover:border-opacity-60 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-2 font-medium ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from last week
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={22} className={c.text} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
