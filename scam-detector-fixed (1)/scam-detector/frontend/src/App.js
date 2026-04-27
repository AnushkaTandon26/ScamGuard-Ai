import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./styles/index.css";
import "./utils/i18n";

// Lazy-loaded pages
const LoginPage      = lazy(() => import("./pages/LoginPage"));
const RegisterPage   = lazy(() => import("./pages/RegisterPage"));
const DashboardPage  = lazy(() => import("./pages/DashboardPage"));
const LiveDetect     = lazy(() => import("./pages/LiveDetectPage"));
const UploadPage     = lazy(() => import("./pages/UploadPage"));
const HistoryPage    = lazy(() => import("./pages/HistoryPage"));
const AdminPage      = lazy(() => import("./pages/AdminPage"));
const SettingsPage   = lazy(() => import("./pages/SettingsPage"));

// Loading spinner
function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading ScamGuard AI...</p>
      </div>
    </div>
  );
}

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" replace />;
}

// Admin route wrapper
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/"        element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="/login"   element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/live"      element={<PrivateRoute><LiveDetect /></PrivateRoute>} />
        <Route path="/upload"    element={<PrivateRoute><UploadPage /></PrivateRoute>} />
        <Route path="/history"   element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
        <Route path="/settings"  element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/admin"     element={<AdminRoute><AdminPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#1e293b", color: "#f1f5f9", border: "1px solid #334155" },
            success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
