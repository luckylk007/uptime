import React from "react";
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import type { UptimeStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: UptimeStatus;
  httpStatus?: number | null;
  className?: string;
}

export function StatusBadge({ status, httpStatus, className = "" }: StatusBadgeProps) {
  switch (status) {
    case "UP":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#70BB3C]/10 text-[#70BB3C] border border-[#70BB3C]/20 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{httpStatus ? `${httpStatus} OK` : "UP"}</span>
        </span>
      );

    case "DOWN":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/20 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>{httpStatus ? `HTTP ${httpStatus}` : "DOWN"}</span>
        </span>
      );

    case "TIMEOUT":
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20 ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>TIMEOUT</span>
        </span>
      );

    case "ERROR":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-600 border border-red-500/20 ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>ERROR</span>
        </span>
      );
  }
}