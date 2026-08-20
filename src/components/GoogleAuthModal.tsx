import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, CheckCircle2, ShieldCheck, Mail, UserCheck, Store, Building2, Shield } from "lucide-react";
import { OFFICIAL_BRANCHES } from "../data/branches";

export const GoogleAuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, loginWithGoogle } = useAuth();
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [customBranchName, setCustomBranchName] = useState(OFFICIAL_BRANCHES[1].name);

  if (!showAuthModal) return null;

  const handleSelectAccount = (
    email: string,
    name: string,
    picture: string,
    branchName?: string,
    branchCode?: string,
    role?: string
  ) => {
    loginWithGoogle({
      email,
      name,
      picture,
      givenName: name.split(" ")[0],
      branchName,
      branchCode,
      role,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const branchObj = OFFICIAL_BRANCHES.find(b => b.name === customBranchName) || OFFICIAL_BRANCHES[1];
    loginWithGoogle({
      email: customEmail,
      name: customName || customEmail.split("@")[0],
      picture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
      givenName: customName ? customName.split(" ")[0] : customEmail.split("@")[0],
      branchName: branchObj.name,
      branchCode: branchObj.code,
      role: branchObj.managerRole || "Branch Staff",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 relative shrink-0">
          <button
            onClick={() => setShowAuthModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-2 shadow-md">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Sign in with Google</h3>
              <p className="text-xs text-slate-300">Sign in as HQ Admin or a Branch Member</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 flex items-start space-x-3 text-xs text-sky-900">
            <ShieldCheck className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Branch Isolation Security:</strong> Non-admin accounts only see requests belonging to their designated branch. HQ Admins can view and approve requests across all branches.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Preset Account
            </label>
            <div className="space-y-2">
              {/* HQ Admin Account */}
              <button
                type="button"
                onClick={() =>
                  handleSelectAccount(
                    "jade.gelv8@gmail.com",
                    "Jade Gelv8",
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                    "GELV INC Advertising",
                    "GELV-01",
                    "HQ Supply Chain Admin"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-2xl border-2 border-amber-300/80 bg-amber-50/40 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                      alt="Jade Gelv8"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/40"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1 rounded-full">HQ</span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-amber-700 flex items-center gap-1.5">
                      <span>Jade Gelv8</span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-200 text-amber-900">👑 HQ Admin</span>
                    </div>
                    <div className="text-xs text-slate-500">jade.gelv8@gmail.com &bull; <strong className="text-slate-700">All Branches Access</strong></div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
              </button>

              {/* Branch 1: Great Print & Sign (GPS-02) */}
              <button
                type="button"
                onClick={() =>
                  handleSelectAccount(
                    "gps.branch@gelvinc.com",
                    "Marco Reyes",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                    "Great Print & Sign",
                    "GPS-02",
                    "Branch Production Lead"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    GPS
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                      <span>Marco Reyes</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Non-Admin</span>
                    </div>
                    <div className="text-xs text-slate-500">gps.branch@gelvinc.com &bull; <strong className="text-orange-700 font-semibold">Great Print & Sign (GPS-02)</strong></div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
              </button>

              {/* Branch 2: VG Formera (VGF-03) */}
              <button
                type="button"
                onClick={() =>
                  handleSelectAccount(
                    "vgf.branch@gelvinc.com",
                    "Carla Bautista",
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
                    "VG Formera",
                    "VGF-03",
                    "Branch Manager / Artist"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    VGF
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                      <span>Carla Bautista</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Non-Admin</span>
                    </div>
                    <div className="text-xs text-slate-500">vgf.branch@gelvinc.com &bull; <strong className="text-pink-700 font-semibold">VG Formera (VGF-03)</strong></div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
              </button>

              {/* Branch 3: Kulay Advertising (KUL-04) */}
              <button
                type="button"
                onClick={() =>
                  handleSelectAccount(
                    "kulay.branch@gelvinc.com",
                    "Danilo Cruz",
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
                    "Kulay Advertising",
                    "KUL-04",
                    "Studio Branch Manager"
                  )
                }
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
                    KUL
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 flex items-center gap-1.5">
                      <span>Danilo Cruz</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">Non-Admin</span>
                    </div>
                    <div className="text-xs text-slate-500">kulay.branch@gelvinc.com &bull; <strong className="text-amber-800 font-semibold">Kulay Advertising (KUL-04)</strong></div>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-blue-600" />
              </button>
            </div>
          </div>

          <div className="relative flex items-center my-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">or custom Google login</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Alex Santos"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Google Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="alex.santos@gmail.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Branch</label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={customBranchName}
                  onChange={(e) => setCustomBranchName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                >
                  {OFFICIAL_BRANCHES.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>Sign In with Selected Branch</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

