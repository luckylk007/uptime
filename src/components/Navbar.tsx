"use client";

import React, { useState } from "react";
import { ShieldCheck, User, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthModal } from "./AuthModal";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const handleOpenAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="w-full bg-[#070e1e] border-b border-slate-800/60 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#70BB3C]/10 border border-[#70BB3C]/30 flex items-center justify-center text-[#70BB3C]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white font-sans">
              UptimePro
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#" className="text-white hover:text-[#70BB3C] transition">
              Home
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#status" className="hover:text-white transition">
              Status Pages
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="#docs" className="hover:text-white transition">
              Docs
            </a>
          </nav>

          {/* User Auth Section */}
          <div className="flex items-center gap-4 text-sm font-semibold">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0e1a2f] border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200">
                  <User className="w-3.5 h-3.5 text-[#70BB3C]" />
                  <span className="max-w-[130px] sm:max-w-[200px] truncate">
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="text-slate-300 hover:text-white transition hidden sm:block font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => handleOpenAuth("signup")}
                  className="bg-[#70BB3C] hover:bg-[#5ea031] text-white px-5 py-2 rounded-lg transition font-medium shadow-sm active:scale-98"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}