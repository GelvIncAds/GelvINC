import React, { useState, useEffect } from "react";
import { GoogleUser, BranchRequest } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Building2,
  Briefcase,
  ShieldCheck,
  Calendar,
  Clock,
  FileJson,
  Download,
  Copy,
  Check,
  LogOut,
  Settings,
  Package,
  Layers,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Shield,
  KeyRound,
  FileText,
  RefreshCcw,
  Store,
  MapPin
} from "lucide-react";
import { OFFICIAL_BRANCHES } from "../data/branches";

interface UserProfileViewProps {
  onNavigate: (tab: "catalog" | "requests" | "admin" | "profile" | "settings") => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigate }) => {
  const { user, isAdmin, logout } = useAuth();

  const [provisioningJson, setProvisioningJson] = useState<{ fileName: string; data: any } | null>(null);
  const [isLoadingJson, setIsLoadingJson] = useState<boolean>(false);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [userRequests, setUserRequests] = useState<BranchRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);

  // Fetch individual user provisioning JSON and their recent branch requests
  useEffect(() => {
    if (!user) return;

    // Fetch Provisioning JSON record
    const fetchJson = async () => {
      setIsLoadingJson(true);
      try {
        const lookupKey = user.id || user.email;
        const res = await fetch(`/api/admin/provisioned-users/by-id/${encodeURIComponent(lookupKey)}`);
        const json = await res.json();
        if (json.success && json.data) {
          setProvisioningJson({ fileName: json.fileName, data: json.data });
        } else {
          // Fallback JSON payload
          setProvisioningJson({
            fileName: `${user.id || "EMP"}_${user.email.replace(/[^a-zA-Z0-9_-]/g, "_")}.json`,
            data: {
              employeeId: user.id || "EMP-LOCAL",
              name: user.name,
              email: user.email,
              branchName: user.branchName || "GELV INC Advertising",
              branchCode: user.branchCode || "GELV-01",
              role: user.role || "Branch Staff",
              authProvider: user.authProvider || (user.picture.includes("google") ? "google" : "password"),
              createdAt: user.createdAt || new Date().toISOString(),
              lastLogin: user.lastLogin || new Date().toISOString(),
            }
          });
        }
      } catch (err) {
        console.warn("Could not load user provisioning JSON:", err);
      } finally {
        setIsLoadingJson(false);
      }
    };

    // Fetch user recent requisitions
    const fetchRequests = async () => {
      setIsLoadingRequests(true);
      try {
        const res = await fetch("/api/branch-requests");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const matching = json.data.filter(
            (r: BranchRequest) =>
              (r.requesterEmail && r.requesterEmail.toLowerCase() === user.email.toLowerCase()) ||
              (r.branchName && user.branchName && r.branchName.toLowerCase() === user.branchName.toLowerCase())
          );
          setUserRequests(matching.slice(0, 5));
        }
      } catch (err) {
        console.warn("Could not load user branch requests:", err);
      } finally {
        setIsLoadingRequests(false);
      }
    };

    fetchJson();
    fetchRequests();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Active User Session</h2>
        <p className="text-sm text-slate-400 mb-6">
          Please sign in with your Google Account or corporate employee credentials to view your profile.
        </p>
        <button
          onClick={() => onNavigate("catalog")}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/30"
        >
          Return to Inventory Catalog
        </button>
      </div>
    );
  }

  const branchInfo = OFFICIAL_BRANCHES.find(
    (b) => b.name === user.branchName || b.code === user.branchCode
  ) || OFFICIAL_BRANCHES[0];

  const handleCopyJson = () => {
    if (!provisioningJson?.data) return;
    navigator.clipboard.writeText(JSON.stringify(provisioningJson.data, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!provisioningJson) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(provisioningJson.data, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", provisioningJson.fileName || "employee_profile.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-24 -mb-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          {/* Avatar and Primary Identity */}
          <div className="flex items-center space-x-5">
            <div className="relative">
              <img
                src={user.picture}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-blue-500/30 shadow-xl bg-slate-800"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-lg shadow-md" title="Account Active & Verified">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {user.name}
                </h1>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    HQ Administrator
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Active Account
                </span>
              </div>

              <p className="text-sm text-slate-300 font-mono mt-1 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{user.email}</span>
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 font-semibold text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>{user.branchName || "GELV INC HQ"} ({user.branchCode || "GELV-01"})</span>
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 font-semibold text-blue-300">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{user.role || "Branch Manager"}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto">
            <button
              onClick={() => onNavigate("settings")}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center space-x-2 shadow-sm"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Site Settings</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                onNavigate("catalog");
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors flex items-center justify-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details & Provisioning Record */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Credentials & Branch Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Official Affiliation & Employment Credentials Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Employment & Branch Credentials</h3>
                  <p className="text-xs text-slate-400">Official company record and authorized role</p>
                </div>
              </div>
              <span className="text-xs font-mono bg-blue-950 text-blue-300 border border-blue-800/80 px-2.5 py-1 rounded-xl font-bold">
                {user.branchCode || "GELV-01"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Official Role / Position
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  {user.role || "Branch Personnel"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Assigned Branch
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  {user.branchName || "GELV INC Advertising"}
                </span>
                {branchInfo?.location && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{branchInfo.location}</span>
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Authentication Type
                </span>
                <span className="text-sm font-extrabold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-400" />
                  {user.picture.includes("google") ? "Google SSO Authentication" : "Enterprise Email & Password"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  System User ID
                </span>
                <span className="text-xs font-mono font-bold text-slate-300 truncate block">
                  {user.id || "ID-AUTO-RESOLVED"}
                </span>
              </div>
            </div>

            {/* Quick Navigation Action Grid */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => onNavigate("requests")}
                className="p-3.5 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-300 text-xs font-bold transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Submit Branch Requisition</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate("catalog")}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition-all flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Explore Inventory Catalog</span>
                </div>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Recent Branch Activity / Requisitions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Recent Branch Requisitions</h3>
                  <p className="text-xs text-slate-400">Requisitions submitted from your profile &amp; branch</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("requests")}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoadingRequests ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center space-x-2">
                <RefreshCcw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Loading activity history...</span>
              </div>
            ) : userRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No branch requisitions recorded yet. Use the Request Portal to order supply materials.
              </div>
            ) : (
              <div className="space-y-3">
                {userRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white">{req.requestNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === "Approved" || req.status === "Dispatched"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : req.status === "Declined"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400">{req.items?.length || 0} items</span>
                      </div>
                      <p className="text-slate-400 mt-1">
                        Purpose: <span className="text-slate-300 font-medium">{req.purpose || "Branch Operations"}</span>
                      </p>
                    </div>

                    <div className="text-slate-500 text-[11px] shrink-0">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: User Provisioning JSON Record Card */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Provisioning JSON File</h3>
                  <p className="text-[11px] text-slate-400">Created upon user account provisioning</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 mb-3 space-y-1">
              <div className="flex items-center justify-between">
                <span>File Name:</span>
                <span className="font-mono text-blue-300 font-bold truncate max-w-[170px]">
                  {provisioningJson?.fileName || "employee.json"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Storage Path:</span>
                <span className="font-mono text-slate-300 text-[11px]">.data/provisioned_users/</span>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/90 font-mono text-[11px] text-blue-200/90 max-h-72 overflow-y-auto mb-4 select-all">
              {isLoadingJson ? (
                <div className="py-8 text-center text-slate-500">Loading JSON payload...</div>
              ) : (
                <pre className="whitespace-pre-wrap">
                  {provisioningJson?.data ? JSON.stringify(provisioningJson.data, null, 2) : "No JSON generated"}
                </pre>
              )}
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <button
                type="button"
                onClick={handleCopyJson}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? "Copied!" : "Copy JSON"}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold shadow-md transition-all flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Quick Support / Contact Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 text-xs text-slate-400 space-y-2">
            <div className="flex items-center space-x-2 text-slate-200 font-bold">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>GELV INC Corporate Network</span>
            </div>
            <p className="leading-relaxed">
              Need assistance updating your assigned branch or designation? Contact HQ Operations Administrator.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
