"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, User, LogOut, Loader2, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features" },
    { name: "Status Pages", href: "/status" },
    { name: "Pricing", href: "/pricing" },
    { name: "Docs", href: "/docs" },
  ];

  return (
    <header className="w-full bg-[#070e1e] border-b border-slate-800/80 text-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#70BB3C]/10 border border-[#70BB3C]/30 flex items-center justify-center text-[#70BB3C] group-hover:scale-105 transition">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white font-sans">
            UptimePro
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`transition ${
                  isActive
                    ? "text-[#70BB3C] font-bold"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Auth Section */}
        <div className="hidden sm:flex items-center gap-4 text-sm font-semibold">
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
              <Link
                href="/login"
                className="text-slate-300 hover:text-white transition font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-[#70BB3C] hover:bg-[#5ea031] text-white px-5 py-2 rounded-lg transition font-medium shadow-sm active:scale-98"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a1426] border-b border-slate-800 px-4 py-6 space-y-4">
          <nav className="flex flex-col space-y-3 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg ${
                  pathname === link.href
                    ? "bg-[#70BB3C]/10 text-[#70BB3C] font-bold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between text-xs text-slate-300 px-3 py-2 bg-slate-900 rounded-lg">
                <span className="truncate">{user.email}</span>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-400 font-bold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold text-slate-200 bg-slate-800 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 py-2 text-center text-xs font-bold text-white bg-[#70BB3C] rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}