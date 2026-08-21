import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock, X, KeyRound, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export const AdminPasscodeModal: React.FC = () => {
  const { showAdminPasscodeModal, setShowAdminPasscodeModal, verifyAndEnableAdmin } = useAuth();
  const [passcode, setPasscode] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!showAdminPasscodeModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passcode.trim()) {
      setError("Please enter the administrator security key.");
      return;
    }

    const success = verifyAndEnableAdmin(passcode);
    if (!success) {
      setError("Access denied. The security key provided is incorrect.");
    } else {
      setPasscode("");
      setError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        
        {/* Close Button */}
        <button
          onClick={() => {
            setShowAdminPasscodeModal(false);
            setError(null);
            setPasscode("");
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto shadow-inner">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-extrabold text-white">Administrator Access Verification</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Central Inventory management, pricing updates, and branch dispatch authorizations require administrative clearance.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Admin Security Passcode
            </label>
            <div className="relative flex items-center">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter authorized admin key"
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-slate-800/90 text-white placeholder-slate-500 text-sm rounded-xl border border-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2 flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAdminPasscodeModal(false);
                setError(null);
                setPasscode("");
              }}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 active:scale-[0.99]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Verify & Unlock</span>
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-800/40 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Authorized personnel can also sign in with an Admin Google account for instant automatic clearance.</span>
        </div>

      </div>
    </div>
  );
};
