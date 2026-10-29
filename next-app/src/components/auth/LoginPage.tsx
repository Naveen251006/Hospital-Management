"use client";

import React, { useState } from "react";
import {
  HeartPulse,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  LogIn,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { UserRole, UserSession } from "@/lib/types";
import { initialSessions } from "@/lib/hospital-data";

interface LoginPageProps {
  onLoginSuccess: (session: UserSession) => void;
  defaultMode?: "login" | "signup";
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  defaultMode = "login",
}) => {
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);

  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Sign up form fields
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<UserRole>("doctor");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Direct Login Submit (No OTP)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = loginEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!loginPassword || loginPassword.length < 3) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    // Determine session based on email
    let session: UserSession;
    if (email.includes("admin")) {
      session = initialSessions.admin;
    } else if (email.includes("smith") || email.includes("doctor")) {
      session = initialSessions.doctor;
    } else if (email.includes("nurse")) {
      session = initialSessions.nurse;
    } else if (email.includes("reception")) {
      session = initialSessions.receptionist;
    } else if (email.includes("pharma")) {
      session = initialSessions.pharmacist;
    } else if (email.includes("lab")) {
      session = initialSessions.lab_tech;
    } else if (email.includes("billing")) {
      session = initialSessions.billing;
    } else {
      const rawName = email.split("@")[0].replace(/[._-]/g, " ");
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      session = {
        id: `usr-${Date.now()}`,
        name: formattedName || "Hospital Staff",
        role: "doctor",
        title: "Medical Specialist",
        department: "General Medicine",
        avatarInitials: (formattedName || "HS").slice(0, 2).toUpperCase(),
      };
    }

    // Direct Instant Login
    setTimeout(() => {
      try {
        sessionStorage.setItem("carepulse_active_user", JSON.stringify(session));
        if (rememberMe) {
          localStorage.setItem("carepulse_active_user", JSON.stringify(session));
        }
      } catch {}
      setIsLoading(false);
      onLoginSuccess(session);
    }, 250);
  };

  // Direct Sign Up Submit (No OTP)
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!signupName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters long.");
      return;
    }

    setIsLoading(true);

    const initials = signupName
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "MD";

    const roleTitles: Record<UserRole, string> = {
      admin: "Hospital Administrator",
      doctor: "Attending Physician",
      nurse: "Staff Nurse",
      receptionist: "Patient Intake Officer",
      pharmacist: "Clinical Pharmacist",
      lab_tech: "Lab Technologist",
      billing: "Billing Officer",
    };

    const newSession: UserSession = {
      id: `usr-${Date.now()}`,
      name: signupName.trim(),
      role: signupRole,
      title: roleTitles[signupRole] || "Healthcare Staff",
      department: signupRole === "doctor" ? "Clinical Care" : "Administration",
      avatarInitials: initials,
    };

    // Direct Instant Sign Up & Login
    setTimeout(() => {
      try {
        sessionStorage.setItem("carepulse_active_user", JSON.stringify(newSession));
        if (rememberMe) {
          localStorage.setItem("carepulse_active_user", JSON.stringify(newSession));
        }
      } catch {}
      setIsLoading(false);
      onLoginSuccess(newSession);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white">
      {/* Clean subtle medical ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Clinical Card */}
      <div className="relative z-10 w-full max-w-md bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/70 p-6 sm:p-9">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-3.5">
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            CarePulse Hospital
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "login"
              ? "Sign in with your email and password"
              : "Create an account to enter the hospital system"}
          </p>
        </div>

        {/* Mode Selector Tabs (Login / Sign Up) */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-white text-sky-700 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{errorMessage}</span>
          </div>
        )}

        {/* ================= 1. LOGIN FORM ================= */}
        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-50 border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="font-medium">Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setLoginEmail("admin@hospital.com");
                  setLoginPassword("admin123");
                }}
                className="text-sky-600 hover:text-sky-700 cursor-pointer font-semibold"
              >
                Auto-fill Demo
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Hospital Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                }}
                className="text-sky-600 hover:text-sky-700 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          /* ================= 2. SIGN UP FORM ================= */
          <form onSubmit={handleSignupSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Role / Profession
              </label>
              <select
                value={signupRole}
                onChange={(e) => setSignupRole(e.target.value as UserRole)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
              >
                <option value="doctor">Doctor / Physician</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist / Front Desk</option>
                <option value="admin">Administrator</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="lab_tech">Lab Scientist</option>
                <option value="billing">Billing Officer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-700 text-white py-3 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-sky-600/25 hover:shadow-lg hover:shadow-sky-600/35 active:scale-[0.99]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Enter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className="text-sky-600 hover:text-sky-700 font-semibold underline underline-offset-4 cursor-pointer"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Clean Footer */}
      <footer className="relative z-10 text-center mt-6 text-xs text-slate-400 flex items-center gap-1.5">
        <ShieldCheck className="w-4 h-4 text-sky-600" />
        <span>CarePulse Hospital • Clinical Healthcare System</span>
      </footer>
    </div>
  );
};
