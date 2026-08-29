import Link from "next/link";
import { ShieldAlert, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#f8fafc]">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 max-w-md w-full text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-[#70BB3C]/10 border border-[#70BB3C]/30 text-[#70BB3C] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-bold text-[#70BB3C] uppercase tracking-wider font-mono">404 Error</span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            Page Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#70BB3C] hover:bg-[#5ea031] text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}