import React, { createContext, useContext, useState, useEffect } from "react";
import { GoogleUser } from "../types";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  db,
  FirebaseUser 
} from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { OFFICIAL_BRANCHES } from "../data/branches";

interface AuthContextType {
  user: GoogleUser | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  authModalTab: "signin" | "signup";
  setAuthModalTab: (tab: "signin" | "signup") => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  openSignInModal: () => void;
  openSignUpModal: () => void;
  signInWithActualGoogle: (options?: { preferredBranchName?: string; preferredRole?: string }) => Promise<void>;
  signUpWithEmail: (data: {
    name: string;
    email: string;
    password: string;
    branchName: string;
    role?: string;
  }) => Promise<boolean>;
  signInWithEmail: (data: {
    email: string;
    password: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  toggleAdminMode: () => void;
  verifyAndEnableAdmin: (passcode: string) => boolean;
  disableAdminMode: () => void;
  setUserBranch: (branchName: string, branchCode: string, role?: string) => Promise<void>;
  showAdminPasscodeModal: boolean;
  setShowAdminPasscodeModal: (show: boolean) => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  authSuccessMessage: string | null;
  setAuthSuccessMessage: (msg: string | null) => void;
}

const ADMIN_EMAILS = [
  "jade.gelv8@gmail.com",
  "admin@gelvinc.com", 
  "supplychain@gelvinc.com",
  "hq@gelvinc.com",
  "operations@gelvinc.com"
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const saved = localStorage.getItem("gelv_user_session");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("gelv_admin_mode") === "true";
  });

  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">("signup");
  const [showAdminPasscodeModal, setShowAdminPasscodeModal] = useState<boolean>(false);

  // Sync state to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem("gelv_user_session", JSON.stringify(user));
    } else {
      localStorage.removeItem("gelv_user_session");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("gelv_admin_mode", String(isAdmin));
  }, [isAdmin]);

  const openSignInModal = () => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthModalTab("signin");
    setShowAuthModal(true);
  };

  const openSignUpModal = () => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthModalTab("signup");
    setShowAuthModal(true);
  };

  // Helper to format Firebase errors
  const formatAuthError = (code: string, fallback: string): string => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please switch to Sign In.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your credentials or create a new account.";
      case "auth/popup-closed-by-user":
        return "Google sign-in popup was closed before completion.";
      case "auth/popup-blocked":
        return "The Google sign-in window was blocked by browser pop-up settings. Please allow pop-ups or use email sign-in.";
      case "auth/unauthorized-domain":
        return "Firebase OAuth Error: Domain 'gelvincads.github.io' needs to be authorized in Firebase Console -> Authentication -> Settings -> Authorized domains. (Add only 'gelvincads.github.io' without paths). You can also sign in/up with Email & Password below instantly!";
      case "auth/network-request-failed":
        return "Network connection error. Please check your internet connection.";
      default:
        return fallback;
    }
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser && fbUser.email) {
        const userEmail = fbUser.email.toLowerCase();
        const isUserAdmin = ADMIN_EMAILS.includes(userEmail);

        try {
          // Check if user has saved branch profile in Firestore
          const userDocRef = doc(db, "users", fbUser.uid);
          const userSnap = await getDoc(userDocRef);

          let branchName = isUserAdmin ? "GELV INC Advertising" : "Great Print & Sign";
          let branchCode = isUserAdmin ? "GELV-01" : "GPS-02";
          let role = isUserAdmin ? "CEO" : "Branch Manager";

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.branchName) branchName = data.branchName;
            if (data.branchCode) branchCode = data.branchCode;
            if (data.role) role = data.role;
          } else {
            // Seed user profile
            const branchObj = OFFICIAL_BRANCHES.find(b => b.name === branchName) || OFFICIAL_BRANCHES[0];
            await setDoc(userDocRef, {
              id: fbUser.uid,
              name: fbUser.displayName || userEmail.split("@")[0],
              email: userEmail,
              picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || userEmail)}`,
              branchName,
              branchCode,
              role,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            }, { merge: true });
          }

          const resolvedUser: GoogleUser = {
            id: fbUser.uid,
            name: fbUser.displayName || userEmail.split("@")[0],
            email: userEmail,
            picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || userEmail)}`,
            givenName: fbUser.displayName ? fbUser.displayName.split(" ")[0] : userEmail.split("@")[0],
            branchName,
            branchCode,
            role,
          };

          setUser(resolvedUser);
          if (isUserAdmin) {
            setIsAdmin(true);
          }
        } catch (err) {
          console.warn("Firestore user sync warning:", err);
          const resolvedUser: GoogleUser = {
            id: fbUser.uid,
            name: fbUser.displayName || userEmail.split("@")[0],
            email: userEmail,
            picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || userEmail)}`,
            givenName: fbUser.displayName ? fbUser.displayName.split(" ")[0] : userEmail.split("@")[0],
            branchName: isUserAdmin ? "GELV INC Advertising" : "Great Print & Sign",
            branchCode: isUserAdmin ? "GELV-01" : "GPS-02",
            role: isUserAdmin ? "CEO" : "Branch Manager",
          };
          setUser(resolvedUser);
          if (isUserAdmin) setIsAdmin(true);
        }
      } else if (!fbUser) {
        // If not logged into Firebase, don't force mock session unless user had signed in
        const saved = localStorage.getItem("gelv_user_session");
        if (!saved) {
          setUser(null);
        }
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sign up with Email & Password
  const signUpWithEmail = async ({
    name,
    email,
    password,
    branchName,
    role
  }: {
    name: string;
    email: string;
    password: string;
    branchName: string;
    role?: string;
  }): Promise<boolean> => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setIsAuthLoading(true);

    try {
      const branchObj = OFFICIAL_BRANCHES.find(b => b.name === branchName) || OFFICIAL_BRANCHES[1];
      const branchCode = branchObj.code;
      const userRole = role || branchObj.managerRole || "Graphic Artist";
      const normalizedEmail = email.trim().toLowerCase();
      const isUserAdmin = ADMIN_EMAILS.includes(normalizedEmail);

      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = credential.user;

      // Update profile with display name
      const photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || normalizedEmail)}`;
      try {
        await updateProfile(fbUser, {
          displayName: name,
          photoURL
        });
      } catch (e) {
        console.warn("Could not update Firebase profile display name:", e);
      }

      // Store in Firestore
      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          name,
          email: normalizedEmail,
          picture: photoURL,
          branchName: isUserAdmin ? "GELV INC Advertising" : branchName,
          branchCode: isUserAdmin ? "GELV-01" : branchCode,
          role: isUserAdmin ? "CEO" : userRole,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not persist new user to Firestore:", err);
      }

      const signedUpUser: GoogleUser = {
        id: fbUser.uid,
        name,
        email: normalizedEmail,
        picture: photoURL,
        givenName: name.split(" ")[0] || normalizedEmail.split("@")[0],
        branchName: isUserAdmin ? "GELV INC Advertising" : branchName,
        branchCode: isUserAdmin ? "GELV-01" : branchCode,
        role: isUserAdmin ? "CEO" : userRole,
      };

      setUser(signedUpUser);
      if (isUserAdmin) setIsAdmin(true);

      setAuthSuccessMessage(`Account created successfully! Welcome, ${name}.`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error("Sign up error:", error);
      setAuthError(formatAuthError(error.code, error.message || "Failed to create account."));
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign in with Email & Password
  const signInWithEmail = async ({
    email,
    password
  }: {
    email: string;
    password: string;
  }): Promise<boolean> => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setIsAuthLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      const fbUser = credential.user;
      const isUserAdmin = ADMIN_EMAILS.includes(normalizedEmail);

      let branchName = isUserAdmin ? "GELV INC Advertising" : "Great Print & Sign";
      let branchCode = isUserAdmin ? "GELV-01" : "GPS-02";
      let role = isUserAdmin ? "CEO" : "Branch Manager";

      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.branchName) branchName = data.branchName;
          if (data.branchCode) branchCode = data.branchCode;
          if (data.role) role = data.role;
        }
        await setDoc(userDocRef, { lastLogin: new Date().toISOString() }, { merge: true });
      } catch (e) {
        console.warn("Could not retrieve Firestore user record:", e);
      }

      const signedInUser: GoogleUser = {
        id: fbUser.uid,
        name: fbUser.displayName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || normalizedEmail)}`,
        givenName: fbUser.displayName ? fbUser.displayName.split(" ")[0] : normalizedEmail.split("@")[0],
        branchName,
        branchCode,
        role,
      };

      setUser(signedInUser);
      if (isUserAdmin) setIsAdmin(true);

      setAuthSuccessMessage(`Welcome back, ${signedInUser.name}!`);
      setShowAuthModal(false);
      return true;
    } catch (error: any) {
      console.error("Sign in error:", error);
      setAuthError(formatAuthError(error.code, error.message || "Failed to sign in with email."));
      return false;
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Sign in with Real Google Account via Firebase Popup
  const signInWithActualGoogle = async (options?: { preferredBranchName?: string; preferredRole?: string }) => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    setIsAuthLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const userEmail = fbUser.email?.toLowerCase() || "";
      const isUserAdmin = ADMIN_EMAILS.includes(userEmail);

      let branchName = options?.preferredBranchName || (isUserAdmin ? "GELV INC Advertising" : "Great Print & Sign");
      const branchObj = OFFICIAL_BRANCHES.find(b => b.name === branchName) || OFFICIAL_BRANCHES[1];
      let branchCode = branchObj.code;
      let role = options?.preferredRole || (isUserAdmin ? "CEO" : (branchObj.managerRole || "Branch Manager"));

      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        await setDoc(userDocRef, {
          id: fbUser.uid,
          name: fbUser.displayName || userEmail.split("@")[0],
          email: userEmail,
          picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || userEmail)}`,
          branchName,
          branchCode,
          role,
          lastLogin: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Could not write user to Firestore:", err);
      }

      const signedInGoogleUser: GoogleUser = {
        id: fbUser.uid,
        name: fbUser.displayName || userEmail.split("@")[0],
        email: userEmail,
        picture: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || userEmail)}`,
        givenName: fbUser.displayName ? fbUser.displayName.split(" ")[0] : userEmail.split("@")[0],
        branchName,
        branchCode,
        role,
      };

      setUser(signedInGoogleUser);
      if (isUserAdmin) {
        setIsAdmin(true);
      }
      setAuthSuccessMessage(`Signed in as ${signedInGoogleUser.name}`);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      setAuthError(formatAuthError(error.code, error.message || "Failed to authenticate with Google."));
    } finally {
      setIsAuthLoading(false);
    }
  };

  const setUserBranch = async (branchName: string, branchCode: string, role?: string) => {
    if (user) {
      const updated: GoogleUser = {
        ...user,
        branchName,
        branchCode,
        role: role || user.role,
      };
      setUser(updated);

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          await setDoc(userDocRef, {
            branchName,
            branchCode,
            role: role || user.role,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn("Could not update branch in Firestore:", e);
        }
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signout warning:", e);
    }
    setUser(null);
    setFirebaseUser(null);
    setIsAdmin(false);
    localStorage.removeItem("gelv_user_session");
    localStorage.removeItem("gelv_admin_mode");
  };

  const toggleAdminMode = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setShowAdminPasscodeModal(true);
    }
  };

  const verifyAndEnableAdmin = (passcode: string): boolean => {
    const cleaned = passcode.trim().toLowerCase();
    if (
      cleaned === "admin123" || 
      cleaned === "gelv2026" || 
      cleaned === "gelvadmin" || 
      cleaned === "admin" || 
      cleaned === "123456" ||
      cleaned === "hq-supply-admin"
    ) {
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
        firebaseUser,
        isAdmin,
        isAuthLoading,
        authModalTab,
        setAuthModalTab,
        showAuthModal,
        setShowAuthModal,
        openSignInModal,
        openSignUpModal,
        signInWithActualGoogle,
        signUpWithEmail,
        signInWithEmail,
        logout,
        toggleAdminMode,
        verifyAndEnableAdmin,
        disableAdminMode,
        setUserBranch,
        showAdminPasscodeModal,
        setShowAdminPasscodeModal,
        authError,
        setAuthError,
        authSuccessMessage,
        setAuthSuccessMessage,
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
