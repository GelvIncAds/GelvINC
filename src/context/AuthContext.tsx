import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleUser } from "../types";

interface AuthContextType {
  user: GoogleUser | null;
  isAdmin: boolean;
  loginWithGoogle: (userProfile?: Partial<GoogleUser>) => void;
  logout: () => void;
  toggleAdminMode: () => void;
  verifyAndEnableAdmin: (passcode: string) => boolean;
  disableAdminMode: () => void;
  setUserBranch: (branchName: string, branchCode: string, role?: string) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  showAdminPasscodeModal: boolean;
  setShowAdminPasscodeModal: (show: boolean) => void;
}

const DEFAULT_GOOGLE_USER: GoogleUser = {
  id: "google-usr-98214",
  name: "Marco Reyes",
  email: "gps.branch@gelvinc.com",
  picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  givenName: "Marco",
  branchName: "Great Print & Sign",
  branchCode: "GPS-02",
  role: "Branch Production Lead"
};

const ADMIN_EMAILS = ["jade.gelv8@gmail.com", "admin@gelvinc.com", "admin@admedia.com"];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem("google_user_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_GOOGLE_USER;
      }
    }
    return DEFAULT_GOOGLE_USER;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("admedia_admin_mode") === "true";
  });

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("google_user_session", JSON.stringify(user));
    } else {
      localStorage.removeItem("google_user_session");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("admedia_admin_mode", String(isAdmin));
  }, [isAdmin]);

  const loginWithGoogle = (customProfile?: Partial<GoogleUser>) => {
    const newUser: GoogleUser = {
      id: customProfile?.id || `google-${Date.now()}`,
      name: customProfile?.name || "Jade Lu",
      email: customProfile?.email || "jade.gelv8@gmail.com",
      picture: customProfile?.picture || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
      givenName: customProfile?.givenName || (customProfile?.name ? customProfile.name.split(" ")[0] : "Jade"),
      branchName: customProfile?.branchName,
      branchCode: customProfile?.branchCode,
      role: customProfile?.role,
    };
    setUser(newUser);
    setShowAuthModal(false);

    // Auto-enable admin mode ONLY if logging in as known HQ admin account
    if (ADMIN_EMAILS.includes(newUser.email.toLowerCase())) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  const setUserBranch = (branchName: string, branchCode: string, role?: string) => {
    if (user) {
      const updated: GoogleUser = {
        ...user,
        branchName,
        branchCode,
        role: role || user.role,
      };
      setUser(updated);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowAdminPasscodeModal(true);
    }
  };

  const verifyAndEnableAdmin = (passcode: string): boolean => {
    if (passcode.trim() === "admin123" || passcode.trim() === "admin" || passcode.trim() === "123456") {
      setIsAdmin(true);
      setShowAdminPasscodeModal(false);
      return true;
    }
    return false;
  };

  const disableAdminMode = () => {
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loginWithGoogle,
        logout,
        toggleAdminMode,
        verifyAndEnableAdmin,
        disableAdminMode,
        setUserBranch,
        showAuthModal,
        setShowAuthModal,
        showAdminPasscodeModal,
        setShowAdminPasscodeModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

