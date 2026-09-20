"use client";

import { Loader2, AlertCircle, WifiOff, ShieldAlert, RefreshCw, Inbox } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function LoadingState({ message = "Loading data..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      <p className="text-sm text-slate-400 font-medium">{message}</p>
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }: ErrorStateProps) {
  const isNetwork = message.toLowerCase().includes("network") || message.toLowerCase().includes("connection");
  const is403 = message.includes("403") || message.toLowerCase().includes("forbidden") || message.toLowerCase().includes("permission");
  const is401 = message.includes("401") || message.toLowerCase().includes("authentication");

  const Icon = is403 ? ShieldAlert : isNetwork ? WifiOff : AlertCircle;
  const iconColor = is403 ? "text-red-400" : isNetwork ? "text-orange-400" : "text-yellow-400";
  const borderColor = is403 ? "border-red-500/30 bg-red-950/20" : "border-yellow-500/30 bg-yellow-950/20";

  return (
    <div className={`rounded-2xl border ${borderColor} p-8 text-center space-y-4 max-w-md mx-auto my-12`}>
      <div className={`mx-auto w-12 h-12 rounded-xl border border-current/20 bg-current/5 flex items-center justify-center ${iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className={`text-sm font-semibold ${iconColor}`}>
          {is401 ? "Authentication Required" : is403 ? "Access Denied" : "Error"}
        </p>
        <p className="text-xs text-slate-400 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No data found",
  description,
  message,
  icon,
}: EmptyStateProps) {
  const text = description || message || "There is nothing to display here yet.";
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-500">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-300">{title}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">{text}</p>
      </div>
    </div>
  );
}
