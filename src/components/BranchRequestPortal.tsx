import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  PackageCheck,
  Send,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Sparkles,
  Download,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
  Layers,
  ShoppingBag,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Store,
  Truck,
  Bell,
  Package,
  MapPin,
  Navigation,
  Barcode,
  PlusCircle,
} from "lucide-react";
import { AdItem, AdCategory, BranchRequest, BranchRequestItem, GoogleUser } from "../types";
import { generateBranchRequestPDF } from "../utils/pdfGenerator";
import { OFFICIAL_BRANCHES, MANAGER_ROLES_CATALOG } from "../data/branches";
import { useAuth } from "../context/AuthContext";

interface BranchRequestPortalProps {
  items: AdItem[];
  user: GoogleUser | null;
  onRefreshInventory: () => void;
}

const BRANCH_LIST = OFFICIAL_BRANCHES;

export const BranchRequestPortal: React.FC<BranchRequestPortalProps> = ({
  items,
  user,
  onRefreshInventory,
}) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");

  // Determine user branch default
  const defaultBranchObj = user?.branchName
    ? BRANCH_LIST.find((b) => b.name === user.branchName || b.code === user.branchCode) || BRANCH_LIST[1]
    : BRANCH_LIST[1]; // Default to Great Print & Sign (GPS-02)

  // Form State
  const [selectedBranch, setSelectedBranch] = useState(defaultBranchObj.name);
  const [branchCode, setBranchCode] = useState(defaultBranchObj.code);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);

  const [customBranchName, setCustomBranchName] = useState("");
  const [requesterName, setRequesterName] = useState(user?.name || "");
  const [requesterEmail, setRequesterEmail] = useState(user?.email || "");
  const [requesterRole, setRequesterRole] = useState(
    user?.role || defaultBranchObj.managerRole || "Branch Store Manager"
  );
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split("T")[0];
  });
  const [purpose, setPurpose] = useState("");

  // Cart / Requisition Items State
  const [itemSelectionMode, setItemSelectionMode] = useState<"database" | "custom">("database");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [requestQty, setRequestQty] = useState<number>(1);
  const [dbItemPriority, setDbItemPriority] = useState<"Normal" | "High Priority" | "Emergency Restock">("Normal");

  // Custom Item Form State (Free entry unrestricted by database)
  const [customTitle, setCustomTitle] = useState("");
  const [customCategory, setCustomCategory] = useState<AdCategory | "Other">("Tarpaulin");
  const [customBrand, setCustomBrand] = useState("");
  const [customSku, setCustomSku] = useState("");
  const [customDimensions, setCustomDimensions] = useState("");
  const [customUnit, setCustomUnit] = useState("Rolls");
  const [customNotes, setCustomNotes] = useState("");
  const [customQty, setCustomQty] = useState<number>(1);
  const [customItemPriority, setCustomItemPriority] = useState<"Normal" | "High Priority" | "Emergency Restock">("Normal");

  const [requestCart, setRequestCart] = useState<BranchRequestItem[]>([]);

  // Feedback State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<BranchRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<BranchRequest[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilterStatus, setHistoryFilterStatus] = useState<string>("All");
  const [historyFilterBranch, setHistoryFilterBranch] = useState<string>("All");
  const [expandedNotifReqIds, setExpandedNotifReqIds] = useState<Record<string, boolean>>({});
  const [selectedNotifModalReq, setSelectedNotifModalReq] = useState<BranchRequest | null>(null);

  // Sync with logged in user
  useEffect(() => {
    if (user) {
      if (user.branchName && !isAdmin) {
        setSelectedBranch(user.branchName);
        if (user.branchCode) setBranchCode(user.branchCode);
      }
      if (user.name) setRequesterName(user.name);
      if (user.email) setRequesterEmail(user.email);
      if (user.role) setRequesterRole(user.role);
    }
  }, [user, isAdmin]);

  // Close Branch Dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsBranchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Set default selected item if available
  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  // Fetch History with branch parameter for non-admin
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      let queryParam = "";
      if (!isAdmin && user?.branchCode) {
        queryParam = `?branchCode=${encodeURIComponent(user.branchCode)}`;
      } else if (!isAdmin && user?.branchName) {
        queryParam = `?branchName=${encodeURIComponent(user.branchName)}`;
      }
      const res = await fetch(`/api/branch-requests${queryParam}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err) {
      console.error("Error fetching branch requests history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const bName = e.target.value;
    setSelectedBranch(bName);
    const found = BRANCH_LIST.find((b) => b.name === bName);
    if (found) {
      setBranchCode(found.code);
    }
  };

  const handleAddItemToCart = () => {
    if (!selectedItemId) return;
    const itemObj = items.find((i) => i.id === selectedItemId);
    if (!itemObj) return;

    if (requestQty < 1) {
      setErrorMessage("Quantity must be at least 1 unit.");
      return;
    }

    setErrorMessage(null);

    // Check if already in cart with same priority
    const existingIndex = requestCart.findIndex((c) => c.itemId === selectedItemId && (c.priority || "Normal") === dbItemPriority);
    if (existingIndex !== -1) {
      const updated = [...requestCart];
      updated[existingIndex].requestedQuantity += requestQty;
      setRequestCart(updated);
    } else {
      setRequestCart([
        ...requestCart,
        {
          itemId: itemObj.id,
          itemTitle: itemObj.title,
          category: itemObj.category,
          brand: itemObj.brand,
          sku: itemObj.sku,
          requestedQuantity: requestQty,
          priority: dbItemPriority,
          dimensions: itemObj.dimensions,
          unitPrice: itemObj.dailyPrice,
          unit: "Rolls",
          isCustom: false,
        },
      ]);
    }

    // Reset Qty to 1
    setRequestQty(1);
  };

  const handleAddCustomItemToCart = () => {
    if (!customTitle.trim()) {
      setErrorMessage("Please enter an Item / Material Name for your custom requisition.");
      return;
    }
    if (customQty < 1) {
      setErrorMessage("Quantity must be at least 1 unit.");
      return;
    }

    setErrorMessage(null);

    const customItem: BranchRequestItem = {
      itemId: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemTitle: customTitle.trim(),
      category: customCategory,
      brand: customBrand.trim() || undefined,
      sku: customSku.trim() ? customSku.trim().toUpperCase() : undefined,
      dimensions: customDimensions.trim() || "Custom Specs",
      specs: customDimensions.trim() || undefined,
      unit: customUnit,
      priority: customItemPriority,
      notes: customNotes.trim() || undefined,
      requestedQuantity: customQty,
      isCustom: true,
    };

    setRequestCart([...requestCart, customItem]);

    // Reset custom form inputs
    setCustomTitle("");
    setCustomBrand("");
    setCustomSku("");
    setCustomDimensions("");
    setCustomNotes("");
    setCustomQty(1);
  };

  const handleRemoveFromCart = (index: number) => {
    setRequestCart(requestCart.filter((_, i) => i !== index));
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestCart.length === 0) {
      setErrorMessage("Please add at least one material item to your branch requisition order.");
      return;
    }
    if (!requesterName.trim() || !requesterEmail.trim()) {
      setErrorMessage("Please fill in the Requester Name and Email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const effectiveBranchName = selectedBranch === "Other / Custom Branch" && customBranchName.trim()
      ? customBranchName.trim()
      : selectedBranch;

    const effectivePriority = requestCart.some((i) => i.priority === "Emergency Restock")
      ? "Emergency Restock"
      : requestCart.some((i) => i.priority === "High Priority")
      ? "High Priority"
      : "Normal";

    const payload = {
      branchName: effectiveBranchName,
      branchCode,
      requesterName: requesterName.trim(),
      requesterEmail: requesterEmail.trim(),
      requesterRole,
      requiredByDate,
      priority: effectivePriority,
      purpose: purpose.trim() || "Branch stock replenishment & local client installations",
      items: requestCart,
    };

    try {
      // 1. Send POST request to HQ server
      const res = await fetch("/api/branch-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit branch requisition");
      }

      const createdReq: BranchRequest = data.data;

      // 2. Generate PDF Form for local download
      const pdfObj = generateBranchRequestPDF(createdReq);

      setSubmitSuccess({
        ...createdReq,
        pdfDataUrl: pdfObj.dataUrl,
      });

      // Clear cart
      setRequestCart([]);
      setPurpose("");

      // Trigger history reload and inventory refresh
      fetchHistory();
      onRefreshInventory();
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while submitting requisition.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine user branch default & accessibility
  const userBranch = user?.branchName || "Great Print & Sign";
  const userBranchCode = user?.branchCode || "GPS-02";

  // Requisitions accessible by current user role
  const userAccessibleHistory = isAdmin
    ? history
    : history.filter(
        (r) =>
          r.branchCode?.toLowerCase() === userBranchCode.toLowerCase() ||
          r.branchName?.toLowerCase() === userBranch.toLowerCase() ||
          (user?.email && r.requesterEmail?.toLowerCase() === user.email.toLowerCase())
      );

  const filteredHistory = userAccessibleHistory.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      req.branchName.toLowerCase().includes(historySearch.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(historySearch.toLowerCase()) ||
      req.items.some((i) => i.itemTitle.toLowerCase().includes(historySearch.toLowerCase()));

    const matchesStatus = historyFilterStatus === "All" || req.status === historyFilterStatus;
    const matchesBranch =
      !isAdmin ||
      historyFilterBranch === "All" ||
      req.branchName === historyFilterBranch ||
      req.branchCode === historyFilterBranch;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-10 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>GELV INC Headquarters Supply Chain Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Branch Stock Requisition <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">&amp; Order Hub</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Submit material requests directly to Headquarters for Tarpaulins, Panaflex, Stickers, Photopapers, and Paperstocks. HQ Admins review, approve, and auto-dispatch inventory in real time.
          </p>

          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Mail className="w-4 h-4 text-amber-400" />
              <span>Target HQ Inbox: <strong className="text-amber-300">jade.gelv8@gmail.com</strong></span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Direct Central Sync</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Auto PDF Requisition Form</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Real-Time Status Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200 gap-4 pb-4">
        <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab("form");
              setSubmitSuccess(null);
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "form"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Send className="w-4 h-4 text-blue-600" />
            <span>New Branch Requisition</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Requisition Tracker &amp; History ({userAccessibleHistory.length})</span>
          </button>
        </div>

        {user && (
          <div className="text-xs text-slate-500 flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <User className="w-3.5 h-3.5 text-blue-500" />
            <span>Logged in as: <strong>{user.name}</strong> ({user.email})</span>
          </div>
        )}
      </div>

      {/* TAB 1: FORM */}
      {activeTab === "form" && (
        <div className="space-y-8">
          {/* Submission Success Modal/Card */}
          {submitSuccess && (
            <div className="p-6 sm:p-8 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      Requisition Submitted to HQ!
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Request Ref: <strong>{submitSuccess.id}</strong> &bull; Priority: {submitSuccess.priority}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSubmitSuccess(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline"
                >
                  Create Another Request
                </button>
              </div>

              <div className="text-xs text-emerald-900 bg-white/80 p-4 rounded-2xl border border-emerald-100 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Requisition Summary:</span>
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    <Mail className="w-3 h-3 text-emerald-600" />
                    <span>Dispatched to jade.gelv8@gmail.com</span>
                  </span>
                </div>
                <div>&bull; Originating Branch: <strong>{submitSuccess.branchName}</strong></div>
                <div>&bull; Requested By: {submitSuccess.requesterName} ({submitSuccess.requesterEmail})</div>
                <div>&bull; Items Requested: <strong>{submitSuccess.items.length} material line(s)</strong></div>
                <div>&bull; Required By Date: {submitSuccess.requiredByDate}</div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => {
                    const pdfRes = generateBranchRequestPDF(submitSuccess);
                    const link = document.createElement("a");
                    link.href = pdfRes.dataUrl;
                    link.download = pdfRes.filename;
                    link.click();
                  }}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Requisition PDF Form</span>
                </button>

                <a
                  href={`mailto:jade.gelv8@gmail.com?subject=${encodeURIComponent(
                    `[Branch Requisition] ${submitSuccess.id} from ${submitSuccess.branchName}`
                  )}&body=${encodeURIComponent(
                    `Hello GELV INC HQ Supply Chain (jade.gelv8@gmail.com),\n\nPlease find the details for Branch Requisition ${submitSuccess.id}:\n\n` +
                    `• Branch: ${submitSuccess.branchName} (${submitSuccess.branchCode})\n` +
                    `• Requester: ${submitSuccess.requesterName} (${submitSuccess.requesterRole})\n` +
                    `• Contact Email: ${submitSuccess.requesterEmail}\n` +
                    `• Required By: ${submitSuccess.requiredByDate}\n` +
                    `• Priority: ${submitSuccess.priority}\n` +
                    `• Purpose: ${submitSuccess.purpose}\n\n` +
                    `Requested Materials:\n` +
                    submitSuccess.items
                      .map((it, idx) => `  ${idx + 1}. ${it.itemTitle} (${it.category}) - ${it.requestedQuantity} units`)
                      .join("\n") +
                    `\n\nThank you,\n${submitSuccess.requesterName}`
                  )}`}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email Direct to jade.gelv8@gmail.com</span>
                </a>

                <button
                  onClick={() => setActiveTab("history")}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all"
                >
                  <span>View in Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmitRequisition} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Branch & Requester Info */}
            <div className="lg:col-span-5 space-y-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 border-b pb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">1. Branch &amp; Requester Information</h2>
              </div>

              <div className="space-y-4">
                {/* Branch Selection Dropdown / Locked Branch for Non-Admins */}
                {!isAdmin ? (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Originating Branch
                      </label>
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3 text-amber-700" />
                        <span>Locked to Your Branch</span>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 text-white shadow-sm"
                        style={{
                          backgroundColor:
                            BRANCH_LIST.find((b) => b.name === selectedBranch || b.code === branchCode)?.badgeColor ||
                            "#2563eb",
                        }}
                      >
                        {branchCode.split("-")[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold text-sm text-slate-900 truncate">
                          {selectedBranch}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {BRANCH_LIST.find((b) => b.name === selectedBranch)?.location || "Registered Branch"} &bull;{" "}
                          <span className="font-mono font-bold text-slate-700">{branchCode}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      Non-admin team accounts can only submit requisitions for their assigned branch.
                    </p>
                  </div>
                ) : (
                  <div className="relative" ref={branchDropdownRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Originating Branch (HQ Admin Selector)
                      </label>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                        {branchCode}
                      </span>
                    </div>

                    {/* Dropdown Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setIsBranchDropdownOpen((prev) => !prev)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between shadow-sm ${
                        isBranchDropdownOpen
                          ? "bg-white border-blue-500 ring-2 ring-blue-500/20"
                          : "bg-slate-50 hover:bg-white hover:border-slate-300 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-sm text-slate-900 truncate">
                            {selectedBranch}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">
                            {BRANCH_LIST.find((b) => b.name === selectedBranch)?.location || "Registered Branch"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
                          {branchCode}
                        </span>
                        {isBranchDropdownOpen ? (
                          <ChevronUp className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Dropdown Menu Panel */}
                    {isBranchDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-3.5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Select from 5 Official Branches</span>
                          <span>Official ID</span>
                        </div>

                        <div className="p-1.5 space-y-1 max-h-72 overflow-y-auto">
                          {BRANCH_LIST.map((b) => {
                            const isSelected = selectedBranch === b.name;
                            return (
                              <button
                                key={b.code}
                                type="button"
                                onClick={() => {
                                  setSelectedBranch(b.name);
                                  setBranchCode(b.code);
                                  if (b.managerRole && (!requesterRole || requesterRole === "Branch Store Manager")) {
                                    setRequesterRole(b.managerRole);
                                  }
                                  setIsBranchDropdownOpen(false);
                                }}
                                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between ${
                                  isSelected
                                    ? "bg-blue-50 border border-blue-200/80 text-blue-950 font-bold"
                                    : "hover:bg-slate-50 text-slate-700 font-medium"
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 text-white shadow-sm"
                                    style={{ backgroundColor: b.badgeColor || '#2563eb' }}
                                  >
                                    {b.code.split("-")[0]}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                                      <span>{b.name}</span>
                                      {b.managerRole && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                          {b.managerRole}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                      {b.location}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 shrink-0 ml-2">
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                    {b.code}
                                  </span>
                                  {isSelected ? (
                                    <Check className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <div className="w-4 h-4" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Requester Name
                    </label>
                    <input
                      type="text"
                      required
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full p-3 border rounded-2xl text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Role / Position
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">Catalog Suggested</span>
                    </div>
                    <input
                      type="text"
                      list="manager-roles-catalog"
                      required
                      value={requesterRole}
                      onChange={(e) => setRequesterRole(e.target.value)}
                      placeholder="e.g. Artist, Branch Manager"
                      className="w-full p-3 border rounded-2xl text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                    <datalist id="manager-roles-catalog">
                      {MANAGER_ROLES_CATALOG.map((role) => (
                        <option key={role} value={role} />
                      ))}
                    </datalist>

                    {/* Quick Role Select Chips including Artist */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {["Artist", "Branch Manager", "Branch Manager / Artist", "Branch Production Lead"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRequesterRole(r)}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition-all ${
                            requesterRole === r
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                          }`}
                        >
                          {r === "Artist" ? "🎨 Artist" : r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Branch Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={requesterEmail}
                    onChange={(e) => setRequesterEmail(e.target.value)}
                    placeholder="branch@gelvinc.com"
                    className="w-full p-3 border rounded-2xl text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Required By Date
                  </label>
                  <input
                    type="date"
                    required
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full p-3 border rounded-2xl text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Project Purpose &amp; Special Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Describe client order reference, store campaign, or reason for stock request..."
                    className="w-full p-3 border rounded-2xl text-xs sm:text-sm text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Item Selector & Cart */}
            <div className="lg:col-span-7 space-y-6">
              {/* Material Selection Card */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                  <div className="flex items-center space-x-2">
                    <PackageCheck className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-base font-bold text-slate-900">2. Add Materials &amp; Supplies to Requisition</h2>
                  </div>

                  {/* Mode Toggle Buttons */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
                    <button
                      type="button"
                      onClick={() => setItemSelectionMode("database")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                        itemSelectionMode === "database"
                          ? "bg-white text-indigo-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>HQ Database Catalog</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemSelectionMode("custom")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center space-x-1.5 ${
                        itemSelectionMode === "custom"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:text-indigo-600"
                      }`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Custom / Any Item</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: FROM HQ DATABASE */}
                {itemSelectionMode === "database" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="sm:col-span-5 space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Choose HQ Material Item</label>
                        <select
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          className="w-full p-2.5 border rounded-xl text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.sku ? `[${item.sku}] ` : `[${item.category}] `}{item.brand ? `(${item.brand}) ` : ""}{item.title} (HQ Stock: {item.stock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Item Priority</label>
                        <select
                          value={dbItemPriority}
                          onChange={(e: any) => setDbItemPriority(e.target.value)}
                          className="w-full p-2.5 border rounded-xl text-xs font-bold text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Normal">🟢 Normal Restock</option>
                          <option value="High Priority">🔥 High Priority</option>
                          <option value="Emergency Restock">🚨 Emergency</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Req. Qty</label>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                            className="w-7 h-8 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={requestQty}
                            onChange={(e) => setRequestQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-12 text-center p-1.5 border rounded-lg text-xs font-bold text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setRequestQty(requestQty + 1)}
                            className="w-7 h-8 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddItemToCart}
                          className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1 transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Item</span>
                        </button>
                      </div>
                    </div>

                    {/* Selected Item Details Preview */}
                    {selectedItemId && (() => {
                      const sel = items.find((i) => i.id === selectedItemId);
                      if (!sel) return null;
                      return (
                        <div className="text-xs text-slate-600 bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl flex flex-wrap gap-x-6 gap-y-1.5 items-center">
                          {sel.brand && (
                            <div><strong>Brand:</strong> <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-indigo-200">{sel.brand}</span></div>
                          )}
                          <div><strong>Dimensions:</strong> {sel.dimensions}</div>
                          {sel.thickness && <div><strong>Thickness:</strong> <span className="font-bold text-indigo-900">{sel.thickness}</span></div>}
                          <div><strong>Available HQ Stock:</strong> <span className={sel.stock > 0 ? "text-emerald-700 font-bold" : "text-red-600 font-bold"}>{sel.stock} units</span></div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* MODE 2: CUSTOM / ANY ITEM (UNRESTRICTED FREEDOM) */}
                {itemSelectionMode === "custom" && (
                  <div className="space-y-4 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-200/80">
                    <div className="flex items-start space-x-2 text-xs text-indigo-900 bg-white/90 p-3 rounded-xl border border-indigo-100">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Custom Requisition Freedom:</span> Enter any printing media, inks, specialty films, spare parts, hardware, or customized roll dimensions without database limitations.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                      {/* Custom Item Title */}
                      <div className="sm:col-span-2 lg:col-span-2 space-y-1">
                        <label className="block font-bold text-slate-700">Item / Material Name *</label>
                        <input
                          type="text"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="e.g. Eco-Solvent Cyan Ink (1L Bottle), 3.2m Seamless Frontlit..."
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Custom Brand */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Brand / Manufacturer</label>
                        <input
                          type="text"
                          value={customBrand}
                          onChange={(e) => setCustomBrand(e.target.value)}
                          placeholder="e.g. Roland, Mimaki, 3M, Avery, Starflex"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Custom Category */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Category</label>
                        <select
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value as any)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Tarpaulin">Tarpaulin</option>
                          <option value="Panaflex">Panaflex</option>
                          <option value="Stickers">Stickers</option>
                          <option value="Photopapers">Photopapers</option>
                          <option value="Paperstocks">Paperstocks</option>
                          <option value="Inks">Inks</option>
                          <option value="Films">Films</option>
                          <option value="Other">Other / Specialty Supplies</option>
                        </select>
                      </div>

                      {/* Custom Priority */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Item Priority</label>
                        <select
                          value={customItemPriority}
                          onChange={(e: any) => setCustomItemPriority(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Normal">🟢 Normal Restock</option>
                          <option value="High Priority">🔥 High Priority</option>
                          <option value="Emergency Restock">🚨 Emergency</option>
                        </select>
                      </div>

                      {/* Custom SKU / Part No */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700 flex items-center justify-between">
                          <span>Item Code / SKU</span>
                          <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                        </label>
                        <input
                          type="text"
                          value={customSku}
                          onChange={(e) => setCustomSku(e.target.value)}
                          placeholder="e.g. INK-CY-01, MAT-CUST-99"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Custom Dimensions / Specs */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Dimensions / Specs</label>
                        <input
                          type="text"
                          value={customDimensions}
                          onChange={(e) => setCustomDimensions(e.target.value)}
                          placeholder="e.g. 1000ml Bottle, 3.2m x 50m, 80 microns"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Unit Type */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Unit Type</label>
                        <select
                          value={customUnit}
                          onChange={(e) => setCustomUnit(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Rolls">Rolls</option>
                          <option value="Liters">Liters</option>
                          <option value="Bottles">Bottles</option>
                          <option value="Boxes">Boxes</option>
                          <option value="Packs">Packs</option>
                          <option value="Units">Units</option>
                          <option value="Sheets">Sheets</option>
                          <option value="Yards">Yards</option>
                          <option value="Pieces">Pieces</option>
                        </select>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="space-y-1">
                        <label className="block font-bold text-slate-700">Quantity Needed</label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                            className="w-9 h-9 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            value={customQty}
                            onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 text-center p-2 border rounded-lg text-xs font-bold text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomQty(customQty + 1)}
                            className="w-9 h-9 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Specific Notes */}
                      <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                        <label className="block font-bold text-slate-700">Item Notes / Remarks</label>
                        <input
                          type="text"
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                          placeholder="e.g. Required for high-speed solvent printer"
                          className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddCustomItemToCart}
                        className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Add Custom Item to Order</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart / Line Items Table */}
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      3. Requisition Order List ({requestCart.length} item line(s))
                    </h2>
                  </div>
                  {requestCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRequestCart([])}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold"
                    >
                      Clear List
                    </button>
                  )}
                </div>

                {requestCart.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-2">
                    <Layers className="w-8 h-8 mx-auto text-slate-300" />
                    <div>No materials added to requisition list yet.</div>
                    <p className="text-[11px] text-slate-400">Select items from the catalog or click "+ Custom / Any Item" to add unrestricted materials.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requestCart.map((cartItem, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          cartItem.isCustom
                            ? "bg-indigo-50/40 border-indigo-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {cartItem.isCustom && (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[10px] flex items-center space-x-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Custom Request</span>
                              </span>
                            )}

                            {/* Item Priority Selector */}
                            <select
                              value={cartItem.priority || "Normal"}
                              onChange={(e) => {
                                const updated = [...requestCart];
                                updated[idx].priority = e.target.value as any;
                                setRequestCart(updated);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border outline-none cursor-pointer transition-colors ${
                                (cartItem.priority || "Normal") === "Emergency Restock"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : (cartItem.priority || "Normal") === "High Priority"
                                  ? "bg-amber-100 text-amber-900 border-amber-300"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-300"
                              }`}
                              title="Set priority for this specific item"
                            >
                              <option value="Normal">🟢 Normal Restock</option>
                              <option value="High Priority">🔥 High Priority</option>
                              <option value="Emergency Restock">🚨 Emergency</option>
                            </select>

                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                              {cartItem.category}
                            </span>
                            {cartItem.brand && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px]">
                                Brand: {cartItem.brand}
                              </span>
                            )}
                            {cartItem.sku && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-[10px]">
                                SKU: {cartItem.sku}
                              </span>
                            )}
                          </div>

                          <div className="font-bold text-slate-900 text-sm">{cartItem.itemTitle}</div>
                          <div className="text-slate-500 flex flex-wrap items-center gap-x-2">
                            <span>Specs: <strong>{cartItem.dimensions || cartItem.specs || "Standard"}</strong></span>
                            {cartItem.notes && (
                              <>
                                <span>&bull;</span>
                                <span className="text-indigo-700 italic">"{cartItem.notes}"</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl font-bold text-slate-800">
                            Qty: <span className="text-blue-600">{cartItem.requestedQuantity} {cartItem.unit || "unit(s)"}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(idx)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || requestCart.length === 0}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-sm font-bold rounded-2xl shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <span>Submitting Requisition to HQ...</span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Requisition to Headquarters</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: HISTORY & TRACKER */}
      {activeTab === "history" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search branch name, ID, or items..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={historyFilterStatus}
                  onChange={(e) => setHistoryFilterStatus(e.target.value)}
                  className="p-2 border rounded-xl text-xs font-semibold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending HQ Review">Pending HQ Review</option>
                  <option value="Approved &amp; Dispatched">Approved &amp; Dispatched</option>
                  <option value="Completed">Completed</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>

            {/* Non-Admin Branch Isolation Notice Banner */}
            {!isAdmin && (
              <div className="bg-amber-50/90 border border-amber-200/80 p-3.5 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold">Branch Access Restricted: {selectedBranch} ({branchCode})</div>
                    <div className="text-[11px] text-amber-800">
                      Showing material requisitions for this branch only. Orders from other branches are strictly restricted to HQ Admin.
                    </div>
                  </div>
                </div>
                <span className="hidden sm:inline-block font-mono text-[10px] bg-amber-200/80 text-amber-950 px-2.5 py-1 rounded-lg font-bold">
                  {userAccessibleHistory.length} Requisition(s)
                </span>
              </div>
            )}

            {/* Branch Filter Chips */}
            {isAdmin ? (
              <div className="flex items-center space-x-2 overflow-x-auto pt-1 pb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0">Branch:</span>
                <button
                  type="button"
                  onClick={() => setHistoryFilterBranch("All")}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    historyFilterBranch === "All"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  All 5 Branches ({history.length})
                </button>
                {BRANCH_LIST.map((b) => {
                  const count = history.filter((h) => h.branchName === b.name || h.branchCode === b.code).length;
                  const isSelected = historyFilterBranch === b.name;
                  return (
                    <button
                      key={b.code}
                      type="button"
                      onClick={() => setHistoryFilterBranch(b.name)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center space-x-1.5 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <span>{b.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center space-x-2 pt-1 pb-1">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0">Your Branch:</span>
                <div className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs flex items-center space-x-2">
                  <Store className="w-3.5 h-3.5" />
                  <span>{selectedBranch} ({branchCode})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                    {userAccessibleHistory.length} Requisitions
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* History List */}
          {isLoadingHistory ? (
            <div className="p-12 text-center text-slate-500 text-xs font-medium">Loading branch requisitions history...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <div>No branch requisitions found matching your filter criteria.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((req) => {
                const isApproved = req.status === "Approved & Dispatched";
                const isDeclined = req.status === "Declined";
                const isShipped = req.shippingStatus === "Shipped Out & En Route";
                const isDelivered = req.shippingStatus === "Delivered" || req.status === "Completed";
                const notifList = req.notifications || [];
                const isExpanded = expandedNotifReqIds[req.id];

                return (
                  <div
                    key={req.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{req.id}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                            {req.branchName} ({req.branchCode})
                          </span>

                          {/* Shipping Status Pill */}
                          {req.shippingStatus && (
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] flex items-center space-x-1 ${
                                isShipped
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : isDelivered
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              <Truck className="w-3 h-3 inline mr-1" />
                              <span>{req.shippingStatus}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>Requester: <strong>{req.requesterName}</strong> ({req.requesterEmail})</span>
                          <span>&bull;</span>
                          <span>Date Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span>Required By: <strong>{req.requiredByDate}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Priority Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            req.priority === "Emergency Restock"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : req.priority === "High Priority"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {req.priority}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : isDeclined
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* LIVE DISPATCH & SHIPPING TRACKER BANNER */}
                    {(isApproved || req.shippingStatus || req.courierName) && (
                      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isShipped
                          ? "bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/50 border-indigo-200"
                          : isDelivered
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-blue-50/50 border-blue-200"
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                            isShipped ? "bg-indigo-600" : isDelivered ? "bg-emerald-600" : "bg-blue-600"
                          }`}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-xs text-slate-900 flex items-center space-x-1.5">
                              <span>Logistics &amp; Dispatch Status:</span>
                              <span className={isShipped ? "text-indigo-700 font-bold" : isDelivered ? "text-emerald-700 font-bold" : "text-blue-700 font-bold"}>
                                {req.shippingStatus || "Approved - Warehouse Preparation"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2">
                              <span>Courier: <strong>{req.courierName || "GELV Logistics Fleet"}</strong></span>
                              <span>&bull;</span>
                              <span>Tracking No: <span className="font-mono font-bold text-slate-800">{req.trackingNumber || "Pending Waybill Assignment"}</span></span>
                              <span>&bull;</span>
                              <span>ETA: <strong>{req.estimatedDeliveryDate || "In Schedule"}</strong></span>
                            </div>
                          </div>
                        </div>

                        {req.shippedAt && (
                          <div className="text-[11px] text-indigo-700 bg-white/80 border border-indigo-200 px-3 py-1.5 rounded-xl font-semibold self-start md:self-auto">
                            Dispatched from HQ: {new Date(req.shippedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* HQ NOTIFICATIONS & DISPATCH NOTICES ACCORDION */}
                    {notifList.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                              <Bell className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-xs text-slate-900">
                              HQ Dispatch &amp; Approval Notices ({notifList.length})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedNotifReqIds((prev) => ({
                                ...prev,
                                [req.id]: !prev[req.id],
                              }))
                            }
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <span>{isExpanded ? "Hide Notice Details" : "View All Notices"}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {/* Always show latest notification */}
                        <div className="bg-white p-3 rounded-xl border border-blue-100 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                              Latest Notice: {notifList[0].type}
                            </span>
                            <span className="text-slate-400">
                              {new Date(notifList[0].timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-slate-900">{notifList[0].title}</div>
                          <p className="text-slate-600 text-xs whitespace-pre-line leading-relaxed">
                            {notifList[0].message}
                          </p>
                          <div className="text-[10px] text-slate-400 pt-0.5">
                            From: {notifList[0].sentBy} &bull; To: {notifList[0].recipientEmail}
                          </div>
                        </div>

                        {/* Expanded historical notices */}
                        {isExpanded && notifList.length > 1 && (
                          <div className="space-y-2 pt-1 border-t border-slate-200">
                            {notifList.slice(1).map((notif) => (
                              <div key={notif.id} className="bg-white/80 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                                    {notif.type}
                                  </span>
                                  <span className="text-slate-400">
                                    {new Date(notif.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="font-bold text-slate-800">{notif.title}</div>
                                <p className="text-slate-600 whitespace-pre-line leading-relaxed">{notif.message}</p>
                                <div className="text-[10px] text-slate-400">
                                  From: {notif.sentBy}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Requisition Items Table */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Material Items Requested ({req.items.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {req.items.map((item, i) => (
                          <div key={i} className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${item.isCustom ? "bg-indigo-50/50 border-indigo-200" : "bg-slate-50 border-slate-100"}`}>
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {item.priority && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                      item.priority === "Emergency Restock"
                                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                                        : item.priority === "High Priority"
                                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                    }`}
                                  >
                                    {item.priority === "Emergency Restock" ? "🚨 Emergency" : item.priority === "High Priority" ? "🔥 High Priority" : "🟢 Normal"}
                                  </span>
                                )}
                                {item.isCustom && (
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white font-extrabold text-[9px]">Custom</span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">{item.category}</span>
                                {item.brand && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[9px]">{item.brand}</span>
                                )}
                                {item.sku && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono text-[9px]">SKU: {item.sku}</span>
                                )}
                              </div>
                              <div className="font-bold text-slate-900">{item.itemTitle}</div>
                              <div className="text-[11px] text-slate-500">{item.dimensions || item.specs || "Standard"}</div>
                              {item.notes && <div className="text-[10px] text-indigo-700 italic">"{item.notes}"</div>}
                            </div>
                            <span className="font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shrink-0 ml-2">
                              {item.requestedQuantity} {item.unit || "units"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remarks & HQ Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-700 block">Branch Purpose / Remarks:</span>
                        <p className="text-slate-600 mt-0.5">{req.purpose || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block">HQ Operations Status / Notes:</span>
                        <p className="text-slate-600 mt-0.5">{req.hqNotes || (isApproved ? "Approved and dispatched from HQ Warehouse." : "Awaiting HQ Admin review.")}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        <span>HQ Reviewer: <strong className="text-slate-700">jade.gelv8@gmail.com</strong></span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={`mailto:jade.gelv8@gmail.com?subject=${encodeURIComponent(
                            `[Branch Requisition Inquiry] ${req.id} from ${req.branchName}`
                          )}&body=${encodeURIComponent(
                            `Hello GELV INC HQ Supply Chain (jade.gelv8@gmail.com),\n\nRegarding Branch Requisition ${req.id}:\n\n` +
                            `• Branch: ${req.branchName} (${req.branchCode})\n` +
                            `• Requester: ${req.requesterName} (${req.requesterEmail})\n` +
                            `• Current Status: ${req.status}\n` +
                            `• Shipping Status: ${req.shippingStatus || 'N/A'}\n` +
                            `• Priority: ${req.priority}\n` +
                            `• Required By: ${req.requiredByDate}\n\n` +
                            `Items:\n` +
                            req.items
                              .map((it, idx) => `  ${idx + 1}. ${it.itemTitle} (${it.category}) - ${it.requestedQuantity} units`)
                              .join("\n") +
                            `\n\nThank you,\n${req.requesterName}`
                          )}`}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all border border-blue-200"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Email HQ (jade.gelv8@gmail.com)</span>
                        </a>

                        <button
                          onClick={() => {
                            const pdfRes = generateBranchRequestPDF(req);
                            const link = document.createElement("a");
                            link.href = pdfRes.dataUrl;
                            link.download = pdfRes.filename;
                            link.click();
                          }}
                          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>Download PDF Slip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
