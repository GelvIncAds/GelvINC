import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Database,
  Calculator,
  BookmarkCheck,
  ShieldAlert,
  LogOut,
  User,
  Radio,
  SlidersHorizontal,
  Building2,
} from "lucide-react";

interface NavbarProps {
  activeTab: "catalog" | "requests" | "admin";
  setActiveTab: (tab: "catalog" | "requests" | "admin") => void;
  totalAvailableStock: number;
  isSyncing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  totalAvailableStock,
  isSyncing,
}) => {
  const { user, isAdmin, logout, toggleAdminMode, setShowAuthModal } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Agency Branding */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab("catalog")}
              className="flex items-center space-x-2 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  GELV INC <span className="text-blue-400 font-extrabold">Advertising</span>
                </span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Tarpaulin & Signage Network
                </span>
              </div>
            </button>

            {/* Live Database Status Indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1 text-xs text-slate-300">
              <span className={`w-2 h-2 rounded-full ${isSyncing ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`}></span>
              <span className="font-medium text-slate-200">
                DB Stock: <strong className="text-emerald-400">{totalAvailableStock}</strong> units active
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "catalog"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Inventory Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                activeTab === "requests"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Branch Request Portal</span>
            </button>

            {/* Admin DB Portal Tab - ONLY Visible for Authenticated Admins */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  activeTab === "admin"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                    : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30"
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Admin DB Portal</span>
              </button>
            )}
          </nav>

          {/* User & Admin controls */}
          <div className="flex items-center space-x-3">
            
            {/* Admin Mode Status / Switch Button */}
            {isAdmin ? (
              <div className="hidden sm:flex items-center space-x-2 bg-amber-500/10 border border-amber-500/40 rounded-xl p-1 text-xs">
                <span className="text-amber-400 pl-2 font-bold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Active</span>
                </span>
                <button
                  onClick={toggleAdminMode}
                  className="px-2 py-1 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold transition-colors"
                  title="Switch to User View"
                >
                  Exit Admin
                </button>
              </div>
            ) : (
              <button
                onClick={toggleAdminMode}
                className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 border border-slate-700/70 rounded-xl text-xs font-semibold transition-colors"
                title="Authenticate as Administrator"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Admin Login</span>
              </button>
            )}

            {/* Google Account Sign-In / Account Dropdown */}
            {user ? (
              <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 rounded-xl p-1.5">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/40"
                />
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-white leading-none">{user.givenName || user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  title="Sign Out of Google"
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center space-x-2 bg-white text-slate-800 hover:bg-slate-100 font-semibold px-3 py-2 rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>Google Sign In</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg ${
              activeTab === "catalog" ? "text-blue-400 font-bold bg-slate-800" : "text-slate-400"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Catalog</span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg ${
              activeTab === "requests" ? "text-blue-400 font-bold bg-slate-800" : "text-slate-400"
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Request HQ</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg ${
                activeTab === "admin" ? "text-amber-400 font-bold bg-slate-800" : "text-slate-400"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Admin DB</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
