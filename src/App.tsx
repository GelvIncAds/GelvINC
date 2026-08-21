import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { CatalogView } from "./components/CatalogView";
import { ItemDetailModal } from "./components/ItemDetailModal";
import { AdminPortal } from "./components/AdminPortal";
import { CampaignCalculator } from "./components/CampaignCalculator";
import { UserReservations } from "./components/UserReservations";
import { BranchRequestPortal } from "./components/BranchRequestPortal";
import { GoogleAuthModal } from "./components/GoogleAuthModal";
import { AdminPasscodeModal } from "./components/AdminPasscodeModal";
import { AdItem } from "./types";
import { INITIAL_INVENTORY } from "./data/initialInventory";
import { CheckCircle2, X } from "lucide-react";

function MainApp() {
  const { user, isAdmin, authSuccessMessage, setAuthSuccessMessage } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"catalog" | "requests" | "admin">("catalog");
  const [items, setItems] = useState<AdItem[]>(() => INITIAL_INVENTORY);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCity, setSelectedCity] = useState<string>("All");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Detail Modal
  const [selectedItemModal, setSelectedItemModal] = useState<AdItem | null>(null);
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState<boolean>(false);

  // Auto-dismiss auth success message
  useEffect(() => {
    if (authSuccessMessage) {
      const t = setTimeout(() => {
        setAuthSuccessMessage(null);
      }, 4500);
      return () => clearTimeout(t);
    }
  }, [authSuccessMessage, setAuthSuccessMessage]);

  // Fetch Inventory from Express API (with static demo fallback)
  const fetchInventory = useCallback(async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsLoading(true);
    setIsSyncing(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedCity && selectedCity !== "All") params.append("location", selectedCity);
      if (inStockOnly) params.append("inStockOnly", "true");

      const res = await fetch(`/api/inventory?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);

        // Keep modal up to date if open
        if (selectedItemModal) {
          const updatedSelected = json.data.find((i: AdItem) => i.id === selectedItemModal.id);
          if (updatedSelected) setSelectedItemModal(updatedSelected);
        }
      }
    } catch (err) {
      // Fallback for static environments (GitHub Pages, etc.)
      console.info("Live backend API unreachable (static mode active), filtering local catalog dataset.");
      let filtered = [...INITIAL_INVENTORY];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(i => 
          i.title?.toLowerCase().includes(q) || 
          i.sku?.toLowerCase().includes(q) || 
          i.category?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
        );
      }
      if (selectedCategory && selectedCategory !== "All") {
        filtered = filtered.filter(i => i.category === selectedCategory);
      }
      if (selectedCity && selectedCity !== "All") {
        filtered = filtered.filter(i => i.location === selectedCity);
      }
      if (inStockOnly) {
        filtered = filtered.filter(i => i.stock > 0);
      }
      setItems(filtered);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [searchQuery, selectedCategory, selectedCity, inStockOnly, selectedItemModal]);

  // Trigger fetch on filter change
  useEffect(() => {
    fetchInventory(true);
  }, [fetchInventory]);

  // Real-time polling auto-sync (every 5 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchInventory(false);
    }, 5000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchInventory]);

  // Redirect non-admin users if trying to access admin tab directly
  useEffect(() => {
    if (!isAdmin && activeTab === "admin") {
      setActiveTab("catalog");
    }
  }, [isAdmin, activeTab]);

  // Admin Manual Stock Change
  const handleUpdateStock = async (itemId: string, newStock: number, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/inventory/${itemId}/stock`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStock,
          updatedBy: isAdmin ? "Admin Portal" : user ? user.name : "System User",
          reason: reason || "Manual Stock Adjustment via Database Console",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to update stock");
      }
      // Re-fetch database
      await fetchInventory(false);
    } catch (err: any) {
      alert("Error updating stock: " + err.message);
    }
  };

  // Admin Add New Asset
  const handleAddItem = async (newItemData: Partial<AdItem>) => {
    const res = await fetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItemData),
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to add asset");
    }
    await fetchInventory(false);
  };

  // Admin Delete Asset
  const handleDeleteItem = async (itemId: string) => {
    const res = await fetch(`/api/admin/inventory/${itemId}`, {
      method: "DELETE",
    });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to delete item");
    }
    await fetchInventory(false);
  };

  // Admin Reset Database
  const handleResetDatabase = async () => {
    const res = await fetch("/api/admin/reset", { method: "POST" });
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || "Failed to reset database");
    }
    await fetchInventory(true);
  };

  // Submit Inquiry (User Hold Slot via Google Account)
  const handleSubmitInquiry = async (data: {
    itemId: string;
    userEmail: string;
    userName: string;
    durationDays: number;
    requestedUnits: number;
    startDate: string;
  }) => {
    setIsSubmittingInquiry(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to submit booking reservation");
      }
      await fetchInventory(false);
      setSelectedItemModal(null);
    } catch (err: any) {
      alert("Error submitting reservation: " + err.message);
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const totalAvailableStock = items.reduce((acc, curr) => acc + (curr.stock || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Notification Toast */}
      {authSuccessMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center justify-between space-x-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-100" />
            <span className="text-xs sm:text-sm font-semibold">{authSuccessMessage}</span>
          </div>
          <button
            onClick={() => setAuthSuccessMessage(null)}
            className="text-emerald-200 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header / Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalAvailableStock={totalAvailableStock}
        isSyncing={isSyncing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "catalog" && (
          <CatalogView
            items={items}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
            inStockOnly={inStockOnly}
            setInStockOnly={setInStockOnly}
            onSelectItem={(item) => setSelectedItemModal(item)}
            onQuickStockChange={handleUpdateStock}
            onRefresh={() => fetchInventory(true)}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
          />
        )}

        {activeTab === "requests" && (
          <BranchRequestPortal
            items={items}
            user={user}
            onRefreshInventory={() => fetchInventory(true)}
          />
        )}

        {activeTab === "admin" && isAdmin && (
          <AdminPortal
            items={items}
            onUpdateStock={handleUpdateStock}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onResetDatabase={handleResetDatabase}
            onRefresh={() => fetchInventory(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">GELV INC Advertising Supply Chain Portal</span> &bull; Tarpaulin, Panaflex &amp; Signage Management System
          </div>
          <div className="flex items-center space-x-4">
            <span>HQ &amp; Branch Supply Chain Network</span>
            <span>&bull;</span>
            <span>Google Account &amp; Email Authentication</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ItemDetailModal
        item={selectedItemModal}
        onClose={() => setSelectedItemModal(null)}
        onSubmitInquiry={handleSubmitInquiry}
        isSubmitting={isSubmittingInquiry}
      />

      <GoogleAuthModal />
      <AdminPasscodeModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
