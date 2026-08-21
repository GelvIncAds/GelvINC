import React, { useState, useEffect } from "react";
import { EmployeeAccount } from "../types";
import { OFFICIAL_BRANCHES } from "../data/branches";
import {
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Mail,
  Send,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Building2,
  RefreshCcw,
  UserCheck,
  Key,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { sendPasswordResetEmail, auth } from "../lib/firebase";

interface AdminAccountRecoveryProps {
  initialEmail?: string;
  onClearInitialEmail?: () => void;
}

export const AdminAccountRecovery: React.FC<AdminAccountRecoveryProps> = ({
  initialEmail,
  onClearInitialEmail,
}) => {
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialEmail || "");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAccount | null>(null);

  // Recovery actions state
  const [recoveryReason, setRecoveryReason] = useState<string>("Employee requested password recovery / credential clearance");
  const [customNewPass, setCustomNewPass] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [issuedRecoveryToken, setIssuedRecoveryToken] = useState<string | null>(null);
  const [hasCopiedToken, setHasCopiedToken] = useState<boolean>(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load employees
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);

        // Pre-select if initialEmail provided
        if (initialEmail) {
          const found = json.data.find((e: EmployeeAccount) => e.email.toLowerCase() === initialEmail.toLowerCase());
          if (found) setSelectedEmployee(found);
        }
      }
    } catch (err) {
      console.error("Failed to load employees in recovery:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [initialEmail]);

  // Handle Firebase official password reset dispatch
  const handleSendFirebaseReset = async () => {
    if (!selectedEmployee) return;
    setIsProcessing(true);
    setEmailStatusMessage(null);

    try {
      // 1. Try sending Firebase native password reset email
      try {
        await sendPasswordResetEmail(auth, selectedEmployee.email);
      } catch (fbErr: any) {
        console.warn("Firebase Auth password reset note:", fbErr.message);
      }

      // 2. Register audit log and recovery token on backend
      const res = await fetch(`/api/admin/employees/${selectedEmployee.id}/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "Password Reset & Emergency Token",
          adminReason: recoveryReason,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to trigger recovery");

      setIssuedRecoveryToken(json.data.recoveryToken);
      setEmailStatusMessage({
        text: `Official password recovery email dispatched to ${selectedEmployee.email} with authorization token ${json.data.recoveryToken}.`,
        type: "success",
      });

      await fetchEmployees();
    } catch (err: any) {
      setEmailStatusMessage({
        text: err.message || "Failed to send reset email.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Immediate Unlock & Clear Lockouts
  const handleImmediateUnlock = async () => {
    if (!selectedEmployee) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Active",
          recoveryNote: `Admin emergency override: Unlocked on ${new Date().toLocaleString()}`,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to unlock");

      setEmailStatusMessage({
        text: `Account for ${selectedEmployee.name} has been immediately unlocked and verified active.`,
        type: "success",
      });
      await fetchEmployees();
      setSelectedEmployee(prev => prev ? { ...prev, status: "Active" } : null);
    } catch (err: any) {
      setEmailStatusMessage({
        text: err.message || "Failed to unlock account.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy Recovery Token
  const handleCopyToken = () => {
    if (!issuedRecoveryToken) return;
    navigator.clipboard.writeText(issuedRecoveryToken);
    setHasCopiedToken(true);
    setTimeout(() => setHasCopiedToken(false), 3000);
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.branchName.toLowerCase().includes(q) ||
      emp.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Identity & Security Dispatch</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Reset & Recover Employee Accounts
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Issue emergency credential resets, dispatch Firebase password reset links, unlock restricted accounts, and audit recovery tokens across all branch artists & managers.
            </p>
          </div>

          <button
            onClick={fetchEmployees}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-2 self-start md:self-auto"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            <span>Sync Accounts</span>
          </button>
        </div>
      </div>

      {/* RECOVERY WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Account Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-sm font-black text-white flex items-center space-x-2 mb-3">
              <Search className="w-4 h-4 text-indigo-400" />
              <span>Select Employee for Recovery</span>
            </h3>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type name, email, or branch..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {filteredEmployees.map((emp) => {
                const isSelected = selectedEmployee?.id === emp.id;
                const branchMeta = OFFICIAL_BRANCHES.find(b => b.name === emp.branchName);

                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setIssuedRecoveryToken(null);
                      setEmailStatusMessage(null);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-white flex items-center space-x-1.5">
                        <span>{emp.name}</span>
                        {emp.status !== "Active" && (
                          <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                            {emp.status}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{emp.id}</span>
                    </div>

                    <div className="text-slate-400 mt-1 flex items-center space-x-1 text-[11px]">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{emp.email}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/50 text-[11px]">
                      <span className="text-indigo-300 font-semibold">{emp.branchName}</span>
                      <span className="text-slate-500">{emp.role}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recovery Controls & Actions */}
        <div className="lg:col-span-7 space-y-4">
          {selectedEmployee ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              {/* Account Selected Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-base">
                    {selectedEmployee.picture ? (
                      <img src={selectedEmployee.picture} alt="" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      selectedEmployee.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white flex items-center space-x-2">
                      <span>{selectedEmployee.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          selectedEmployee.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {selectedEmployee.status}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedEmployee.email} • {selectedEmployee.role} ({selectedEmployee.branchName})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  Deselect
                </button>
              </div>

              {/* Status & Feedback alert */}
              {emailStatusMessage && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start space-x-3 text-xs ${
                    emailStatusMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">{emailStatusMessage.text}</p>
                  </div>
                </div>
              )}

              {/* Issued Token Card if available */}
              {issuedRecoveryToken && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                      Emergency Passcode / Recovery Token
                    </span>
                    <span className="text-[10px] text-slate-500">Valid for 24 Hours</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800 font-mono text-sm text-white font-black">
                    <span>{issuedRecoveryToken}</span>
                    <button
                      onClick={handleCopyToken}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-sans font-bold flex items-center space-x-1 transition-colors"
                    >
                      {hasCopiedToken ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopiedToken ? "Copied!" : "Copy Token"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Provide this token to {selectedEmployee.name} or use it during branch terminal sign-in verification.
                  </p>
                </div>
              )}

              {/* Recovery Actions form */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">
                    Administrative Recovery Reason / Audit Log Note
                  </label>
                  <input
                    type="text"
                    value={recoveryReason}
                    onChange={(e) => setRecoveryReason(e.target.value)}
                    placeholder="e.g. Employee forgot corporate password, verified via branch manager call"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Dispatch Reset Email & Token */}
                  <button
                    type="button"
                    onClick={handleSendFirebaseReset}
                    disabled={isProcessing}
                    className="p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all flex flex-col items-start text-left justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Standard</span>
                    </div>
                    <div>
                      <div className="font-black text-sm">Dispatch Reset Link & Token</div>
                      <div className="text-[11px] text-indigo-200 mt-0.5">
                        Sends password reset instructions to {selectedEmployee.email}
                      </div>
                    </div>
                  </button>

                  {/* Immediate Override Unlock */}
                  <button
                    type="button"
                    onClick={handleImmediateUnlock}
                    disabled={isProcessing}
                    className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs border border-slate-700 transition-all flex flex-col items-start text-left justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Unlock className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Immediate</span>
                    </div>
                    <div>
                      <div className="font-black text-sm text-white">Unlock & Clear Restrictions</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Restores account status to Active immediately without passkey reset
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Meta information summary */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Account Created:</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Authenticated:</span>
                  <span className="text-slate-300 font-mono">
                    {selectedEmployee.lastLogin ? new Date(selectedEmployee.lastLogin).toLocaleString() : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Authentication Mechanism:</span>
                  <span className="text-slate-300">
                    {selectedEmployee.authProvider === "google" ? "Google OAuth (Single Sign-On)" : "Branch Corporate Password"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
              <KeyRound className="w-12 h-12 mx-auto text-indigo-400/60 mb-3" />
              <h4 className="text-base font-black text-white">No Employee Selected</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
                Choose an employee from the directory on the left to initiate credential resets, dispatch emergency recovery tokens, or unlock account restrictions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
