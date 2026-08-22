import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Settings,
  ShieldCheck,
  RefreshCw,
  Bell,
  Monitor,
  Database,
  Building2,
  Lock,
  LogOut,
  Save,
  Check,
  Smartphone,
  Eye,
  Sliders,
  SlidersHorizontal,
  Info,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft
} from "lucide-react";
import { OFFICIAL_BRANCHES } from "../data/branches";

interface SiteSettingsViewProps {
  onNavigate: (tab: "catalog" | "requests" | "admin" | "profile" | "settings") => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

export const SiteSettingsView: React.FC<SiteSettingsViewProps> = ({
  onNavigate,
  autoRefresh,
  setAutoRefresh,
}) => {
  const { user, isAdmin, logout } = useAuth();

  // Settings states stored in local storage
  const [preferredBranch, setPreferredBranch] = useState<string>(() => {
    return localStorage.getItem("gelv_pref_branch") || user?.branchName || OFFICIAL_BRANCHES[1].name;
  });

  const [pdfAutoDownload, setPdfAutoDownload] = useState<boolean>(() => {
    return localStorage.getItem("gelv_pdf_autodownload") !== "false";
  });

  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("gelv_low_stock_thresh");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [notificationSound, setNotificationSound] = useState<boolean>(() => {
    return localStorage.getItem("gelv_sound_alerts") === "true";
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("gelv_pref_branch", preferredBranch);
    localStorage.setItem("gelv_pdf_autodownload", String(pdfAutoDownload));
    localStorage.setItem("gelv_low_stock_thresh", String(lowStockAlertThreshold));
    localStorage.setItem("gelv_sound_alerts", String(notificationSound));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm("Clear locally cached filters and temporary session preferences?")) {
      localStorage.removeItem("gelv_pref_branch");
      localStorage.removeItem("gelv_pdf_autodownload");
      localStorage.removeItem("gelv_low_stock_thresh");
      alert("Local preferences reset to system defaults.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Site &amp; Portal Settings</h1>
            <p className="text-xs text-slate-400">
              Customize supply chain preferences, auto-sync parameters, and device security
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate("profile")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>My Profile</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center space-x-2.5 animate-in slide-in-from-top-2">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Settings successfully saved and applied to your device!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Section 1: Real-Time Sync & Catalog Preferences */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Live Synchronization &amp; Inventory</h3>
              <p className="text-xs text-slate-400">Configure polling frequency and low-stock alerting</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Auto-Refresh Polling */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div>
                <label className="text-sm font-bold text-white block">Auto-Sync Live Inventory</label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Continuously pull real-time database stock levels across all GELV INC branches (every 5 seconds)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Default Branch Choice */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <label className="text-sm font-bold text-white block mb-1">
                Default Branch Pre-Selection
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Automatically pre-fill this branch location when initiating material requisitions
              </p>
              <select
                value={preferredBranch}
                onChange={(e) => setPreferredBranch(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {OFFICIAL_BRANCHES.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} ({b.code}) — {b.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Threshold */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-sm font-bold text-white block">
                  Low Stock Warning Threshold
                </label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Highlight inventory assets in orange badge when available units fall below this count
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={lowStockAlertThreshold}
                  onChange={(e) => setLowStockAlertThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-xs font-semibold text-slate-400">units</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Requisitions & PDF Dispatch Options */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Requisitions &amp; Document Generation</h3>
              <p className="text-xs text-slate-400">Automated PDF receipts and notification sound settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div>
                <label className="text-sm font-bold text-white block">Auto-Download Requisition Slip (PDF)</label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automatically generate and trigger browser PDF download upon requisition submission
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfAutoDownload}
                  onChange={(e) => setPdfAutoDownload(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div>
                <label className="text-sm font-bold text-white block">Audio Feedback on Dispatch</label>
                <p className="text-xs text-slate-400 mt-0.5">
                  Play subtle confirmation chime when material requests are successfully approved
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSound}
                  onChange={(e) => setNotificationSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Device Security & Active Session */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Device Security &amp; Session</h3>
              <p className="text-xs text-slate-400">Current device connection and sign-out controls</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>Current Environment:</span>
              </span>
              <span className="text-white font-mono font-semibold">Web Client (Secure Browser Session)</span>
            </div>

            {user && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Logged in as:</span>
                  </span>
                  <span className="text-white font-semibold">{user.name} ({user.email})</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Active Branch Session:</span>
                  </span>
                  <span className="text-white font-semibold">{user.branchName || "GELV INC Advertising"}</span>
                </div>
              </>
            )}

            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleClearCache}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear Local Cache &amp; Reset
              </button>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  onNavigate("catalog");
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out from this Device</span>
              </button>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate("profile")}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>
        </div>

      </form>

    </div>
  );
};
