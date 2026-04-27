import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MdShield, MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", username: "", email: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.username) { toast.error("Fill all required fields"); return; }
    if (form.password !== form.confirm) { toast.error("Passwords do not match"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      await register({ full_name: form.full_name, username: form.username, email: form.email, password: form.password });
      toast.success("Account created! Welcome to ScamGuard.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type, placeholder, icon) => (
    <div>
      <label className="block text-sm font-medium text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type === "password" ? (showPwd ? "text" : "password") : type}
          placeholder={placeholder}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="input-field pl-10"
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            {showPwd ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-900/50">
            <MdShield size={36} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-slate-400 mt-1 text-sm">Join ScamGuard AI — stay protected</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {field("full_name", "Full Name", "text", "Jane Doe", <MdPerson size={18} />)}
            {field("username",  "Username",  "text", "janedoe",  <MdPerson size={18} />)}
            {field("email",     "Email",     "email","you@example.com", <MdEmail size={18} />)}
            {field("password",  "Password",  "password", "••••••••", <MdLock size={18} />)}

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Confirm Password</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className={`input-field pl-10 ${form.confirm && form.confirm !== form.password ? "border-red-500" : ""}`}
                />
              </div>
              {form.confirm && form.confirm !== form.password && (
                <p className="text-red-400 text-xs mt-1">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
