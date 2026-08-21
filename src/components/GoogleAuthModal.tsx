import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  X, 
  Mail, 
  UserCheck, 
  Store, 
  Loader2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn, 
  Sparkles,
  Briefcase,
  Globe,
  Copy,
  Check,
  ExternalLink,
  Info
} from "lucide-react";
import { OFFICIAL_BRANCHES, COMPANY_ROLES } from "../data/branches";

export const GoogleAuthModal: React.FC = () => {
  const { 
    showAuthModal, 
    setShowAuthModal, 
    authModalTab,
    setAuthModalTab,
    signInWithActualGoogle, 
    signUpWithEmail,
    signInWithEmail,
    isAuthLoading,
    authError,
    setAuthError
  } = useAuth();

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpBranch, setSignUpBranch] = useState(OFFICIAL_BRANCHES[1].name);
  const [signUpRole, setSignUpRole] = useState("Graphic Artist");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Domain help toggle & copy state
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showDomainGuide, setShowDomainGuide] = useState(false);

  // Google Branch choice
  const [selectedBranchForGoogle, setSelectedBranchForGoogle] = useState(OFFICIAL_BRANCHES[1].name);

  if (!showAuthModal) return null;

  const handleCopyDomain = () => {
    navigator.clipboard.writeText("gelvincads.github.io");
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const isUnauthorizedDomain = authError && (
    authError.includes("unauthorized-domain") || 
    authError.includes("gelvincads.github.io") ||
    authError.includes("Authorized domains")
  );

  const handleActualGoogleLogin = async () => {
    const branchObj = OFFICIAL_BRANCHES.find(b => b.name === selectedBranchForGoogle) || OFFICIAL_BRANCHES[1];
    await signInWithActualGoogle({
      preferredBranchName: branchObj.name,
      preferredRole: branchObj.managerRole || "Branch Manager"
    });
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword || !signUpName) {
      setAuthError("Please fill out your name, email, and password.");
      return;
    }
    if (signUpPassword.length < 6) {
      setAuthError("Password must be at least 6 characters long.");
      return;
    }

    await signUpWithEmail({
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      password: signUpPassword,
      branchName: signUpBranch,
      role: signUpRole
    });
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      setAuthError("Please enter both email and password.");
      return;
    }

    await signInWithEmail({
      email: signInEmail.trim(),
      password: signInPassword
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 relative shrink-0">
          <button
            onClick={() => {
              setAuthError(null);
              setShowAuthModal(false);
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-lg ring-4 ring-white/10 shrink-0">
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
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">GELV INC Network</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                  Firebase Auth
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Advertising Materials Requisition & Supply Portal
              </p>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-800/80 rounded-2xl border border-slate-700/80">
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthModalTab("signup");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                authModalTab === "signup"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account (Sign Up)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthModalTab("signin");
              }}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                authModalTab === "signin"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Error Notice */}
          {authError && (
            <div className={`rounded-2xl p-4 flex flex-col space-y-3 text-xs animate-in fade-in ${
              isUnauthorizedDomain 
                ? "bg-amber-50 border-2 border-amber-300 text-amber-900" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              <div className="flex items-start space-x-3">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isUnauthorizedDomain ? "text-amber-600" : "text-red-600"}`} />
                <div className="flex-1">
                  <p className="font-bold text-sm">{isUnauthorizedDomain ? "GitHub Pages Domain Authorization Required" : "Authentication Notice"}</p>
                  <p className="mt-1 leading-relaxed">{authError}</p>
                </div>
              </div>

              {isUnauthorizedDomain && (
                <div className="bg-white/90 rounded-xl p-3.5 border border-amber-200 space-y-2.5 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-slate-600">Authorized Domain Value to Add:</span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain ? "Copied!" : "Copy Domain"}</span>
                    </button>
                  </div>
                  
                  <div className="bg-slate-900 text-amber-300 px-3 py-2 rounded-lg font-mono text-xs font-bold select-all flex items-center justify-between">
                    <span>gelvincads.github.io</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">(Do NOT include /gelvinc or https://)</span>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1.5 pt-1">
                    <div className="font-semibold text-slate-800">How to authorize in 30 seconds:</div>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Open <a href="https://console.firebase.google.com/project/gen-lang-client-0842081261/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold inline-flex items-center gap-0.5">Firebase Console Settings <ExternalLink className="w-2.5 h-2.5" /></a></li>
                      <li>Scroll down to <strong>Authorized domains</strong> &rarr; Click <strong>Add domain</strong></li>
                      <li>Enter <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-900">gelvincads.github.io</code> and click <strong>Save</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                    ✨ <strong>Immediate Alternative:</strong> You can also sign up or sign in using <strong>Email & Password</strong> below right away without waiting!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Domain Setup Pill (expandable) */}
          {!isUnauthorizedDomain && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowDomainGuide(!showDomainGuide)}
                className="text-[11px] text-slate-500 hover:text-blue-600 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Globe className="w-3 h-3" />
                <span>{showDomainGuide ? "Hide Domain Authorization Guide" : "Deploying to GitHub Pages? View Domain Guide"}</span>
              </button>

              {showDomainGuide && (
                <div className="mt-2 text-left bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-700 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-blue-600" />
                      GitHub Pages Domain Configuration
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyDomain}
                      className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-[11px] font-bold transition-all flex items-center space-x-1"
                    >
                      {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedDomain ? "Copied" : "Copy gelvincads.github.io"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Firebase Authentication requires the root domain name in its whitelist. In <a href="https://console.firebase.google.com/project/gen-lang-client-0842081261/authentication/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">Firebase Console &rarr; Auth Settings</a>, add <code className="bg-slate-200 px-1 rounded font-bold text-slate-900">gelvincads.github.io</code> (do not include repository subpath like <code className="text-red-500">/gelvinc</code>).
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 1: SIGN UP */}
          {authModalTab === "signup" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Option A: Fast 1-Click Google Sign-Up */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Instant Google Sign Up
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Live OAuth
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-700">Choose Your Assigned Branch:</label>
                  <select
                    value={selectedBranchForGoogle}
                    onChange={(e) => setSelectedBranchForGoogle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-blue-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
                  >
                    {OFFICIAL_BRANCHES.map((b) => (
                      <option key={b.code} value={b.name}>
                        {b.name} ({b.code}) — {b.location}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  disabled={isAuthLoading}
                  onClick={handleActualGoogleLogin}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-800 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 active:scale-[0.99]"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
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
                      <span>Sign Up with Google Account</span>
                    </>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="relative flex items-center my-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Or Sign Up with Email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Option B: Direct Email & Password Sign Up Form */}
              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="e.g. Maria Santos"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Branch</label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={signUpBranch}
                        onChange={(e) => setSignUpBranch(e.target.value)}
                        className="w-full pl-9 pr-2 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium truncate"
                      >
                        {OFFICIAL_BRANCHES.map((b) => (
                          <option key={b.code} value={b.name}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Role / Position</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={signUpRole}
                        onChange={(e) => setSignUpRole(e.target.value)}
                        className="w-full pl-9 pr-2 py-2.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      >
                        {COMPANY_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Free Account</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-1">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthModalTab("signin");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Sign In instead
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN IN */}
          {authModalTab === "signin" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Option A: Real Google Sign-In */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white border-2 border-blue-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Google Account Sign-In
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Live OAuth
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  Sign in instantly using your personal or company Google account.
                </p>

                <button
                  type="button"
                  disabled={isAuthLoading}
                  onClick={handleActualGoogleLogin}
                  className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-blue-400 text-slate-800 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 active:scale-[0.99]"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
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
                      <span>Sign In with Google</span>
                    </>
                  )}
                </button>
              </div>

              {/* Option B: Email & Password Sign In Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="your.email@company.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showSignInPassword ? "text" : "password"}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 active:scale-[0.99]"
                >
                  {isAuthLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In with Password</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setAuthModalTab("signup");
                  }}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Create an account (Sign Up)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
