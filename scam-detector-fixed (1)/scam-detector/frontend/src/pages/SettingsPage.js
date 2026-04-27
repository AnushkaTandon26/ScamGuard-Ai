import React, { useState } from "react";
import { motion } from "framer-motion";
import { MdPerson, MdLock, MdLanguage, MdSave, MdNotifications } from "react-icons/md";
import Layout from "../components/common/Layout";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../utils/api";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
];

function Section({ title, icon: Icon, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-700/60">
        <div className="w-9 h-9 bg-blue-600/20 rounded-xl flex items-center justify-center">
          <Icon size={18} className="text-blue-400" />
        </div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { i18n } = useTranslation();

  const [profile, setProfile] = useState({ full_name: user?.full_name || "", username: user?.username || "" });
  const [pwdForm, setPwdForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving,  setSaving]  = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await authAPI.updateProfile(profile);
      await refreshUser();
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (pwdForm.new_password !== pwdForm.confirm) { toast.error("Passwords don't match"); return; }
    if (pwdForm.new_password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPwd(true);
    try {
      await authAPI.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      setPwdForm({ current_password: "", new_password: "", confirm: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("language", code);
    toast.success(`Language set to ${LANGUAGES.find(l => l.code === code)?.label}`);
  };

  return (
    <Layout title="Settings" subtitle="Manage your account and preferences">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Account info card */}
        <div className="card bg-gradient-to-r from-blue-900/20 to-slate-800 border border-blue-500/20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center
                            text-white text-2xl font-bold flex-shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white text-lg font-bold">{user?.full_name || user?.username}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mt-1 inline-block
                ${user?.role === "admin" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                {user?.role === "admin" ? "👑 Admin" : "User"}
              </span>
            </div>
          </div>
        </div>

        {/* Profile section */}
        <Section title="Profile" icon={MdPerson}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
              <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="input-field" placeholder="Your full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
              <input value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="input-field" placeholder="username" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email</label>
              <input value={user?.email || ""} disabled className="input-field opacity-50 cursor-not-allowed" />
              <p className="text-slate-500 text-xs mt-1">Email cannot be changed</p>
            </div>
            <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><MdSave size={16} /> Save Profile</>}
            </button>
          </div>
        </Section>

        {/* Password section */}
        <Section title="Change Password" icon={MdLock}>
          <div className="space-y-4">
            {[
              ["current_password", "Current Password"],
              ["new_password",     "New Password"],
              ["confirm",          "Confirm New Password"],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
                <input type="password" value={pwdForm[key]}
                  onChange={(e) => setPwdForm({ ...pwdForm, [key]: e.target.value })}
                  className="input-field" placeholder="••••••••" />
              </div>
            ))}
            <button onClick={handleChangePassword} disabled={savingPwd} className="btn-primary">
              {savingPwd ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</> : <><MdLock size={16} /> Update Password</>}
            </button>
          </div>
        </Section>

        {/* Language section */}
        <Section title="Language" icon={MdLanguage}>
          <div className="grid grid-cols-3 gap-3">
            {LANGUAGES.map(({ code, label }) => (
              <button key={code} onClick={() => handleLanguage(code)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border
                  ${i18n.language === code
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"}`}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Notification prefs */}
        <Section title="Notifications" icon={MdNotifications}>
          <div className="space-y-3">
            {[
              { label: "Alert on scam detection",   desc: "Get notified instantly when a scam is detected",  defaultOn: true  },
              { label: "Weekly summary email",       desc: "Receive a weekly report of your scan activity",   defaultOn: false },
              { label: "High-risk alerts only",      desc: "Only notify for High risk detections",            defaultOn: false },
            ].map(({ label, desc, defaultOn }) => {
              const [on, setOn] = useState(defaultOn);
              return (
                <div key={label} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-slate-200 text-sm font-medium">{label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                  </div>
                  <button onClick={() => { setOn(!on); toast.success(`${label} ${!on ? "enabled" : "disabled"}`); }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex-shrink-0
                      ${on ? "bg-blue-600" : "bg-slate-700"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300
                      ${on ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

      </div>
    </Layout>
  );
}
