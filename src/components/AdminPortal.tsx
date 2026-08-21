import React, { useState, useEffect } from "react";
import { AdItem, StockAuditLog, Inquiry, AdCategory, BranchRequest } from "../types";
import { generateRequestPDF, generateBranchRequestPDF } from "../utils/pdfGenerator";
import { OFFICIAL_BRANCHES } from "../data/branches";
import {
  Database,
  Plus,
  Minus,
  Save,
  RefreshCcw,
  History,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  Download,
  Upload,
  Sparkles,
  ShieldAlert,
  FileText,
  Mail,
  Building2,
  PackageCheck,
  Truck,
  Target,
  Sliders,
  Scale,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Layers,
  Barcode,
  Tag,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  Send,
  Bell,
  BellRing,
  Navigation,
  Clock,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  ExternalLink,
  Store,
} from "lucide-react";

interface AdminPortalProps {
  items: AdItem[];
  onUpdateStock: (itemId: string, newStock: number, reason?: string) => Promise<void>;
  onAddItem: (newItemData: Partial<AdItem>) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
  onRefresh: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  items,
  onUpdateStock,
  onAddItem,
  onDeleteItem,
  onResetDatabase,
  onRefresh,
}) => {
  const [stockInputs, setStockInputs] = useState<Record<string, number>>({});
  const [savingItemIds, setSavingItemIds] = useState<Record<string, boolean>>({});
  const [auditLogs, setAuditLogs] = useState<StockAuditLog[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [branchRequests, setBranchRequests] = useState<BranchRequest[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<"stock" | "add" | "logs" | "inquiries" | "branch-requests">("stock");

  // Branch Requests Filter State
  const [branchFilterBranch, setBranchFilterBranch] = useState<string>("All");
  const [branchSearchQuery, setBranchSearchQuery] = useState<string>("");

  // Stock Filter & Search State
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [stockCategoryFilter, setStockCategoryFilter] = useState<string>("All");
  const [stockStatusFilter, setStockStatusFilter] = useState<"All" | "Low" | "SoldOut" | "Available">("All");
  const [stockSortBy, setStockSortBy] = useState<"stock-asc" | "stock-desc" | "title" | "price-desc">("stock-asc");

  // Calibration & Stock Action Modal State
  const [calibratingItem, setCalibratingItem] = useState<AdItem | null>(null);
  const [calibrationMode, setCalibrationMode] = useState<"add" | "remove" | "recalibrate">("add");
  const [addQty, setAddQty] = useState<number>(5);
  const [removeQty, setRemoveQty] = useState<number>(1);
  const [recalibrateValue, setRecalibrateValue] = useState<number>(10);
  const [reasonPreset, setReasonPreset] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmittingCalibration, setIsSubmittingCalibration] = useState<boolean>(false);
  const [showDeleteConfirmInCalibration, setShowDeleteConfirmInCalibration] = useState<boolean>(false);
  const [isDeletingInCalibration, setIsDeletingInCalibration] = useState<boolean>(false);

  // Branch Request Dispatch & Notification Modal State
  const [dispatchModalReq, setDispatchModalReq] = useState<BranchRequest | null>(null);
  const [dispatchActionType, setDispatchActionType] = useState<"approve" | "ship" | "notify" | "view">("approve");
  const [notifyShippingStatus, setNotifyShippingStatus] = useState<
    "Preparing for Dispatch" | "Shipped Out & En Route" | "Delivered" | "Ready for Pickup"
  >("Preparing for Dispatch");
  const [notifyCourier, setNotifyCourier] = useState<string>("GELV Logistics Fleet (Van #1 - Paranaque)");
  const [notifyCustomCourier, setNotifyCustomCourier] = useState<string>("");
  const [notifyTracking, setNotifyTracking] = useState<string>("");
  const [notifyETA, setNotifyETA] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [notifyMessage, setNotifyMessage] = useState<string>("");
  const [notifySubject, setNotifySubject] = useState<string>("");
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState<boolean>(false);
  const [autoDecrementStock, setAutoDecrementStock] = useState<boolean>(true);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Add Item Form State
  const [newSku, setNewSku] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<AdCategory>("Tarpaulin");
  const [newDimensions, setNewDimensions] = useState("14ft x 48ft");
  const [newThickness, setNewThickness] = useState("13oz Heavy-Duty");
  const [newImpressions, setNewImpressions] = useState("250000");
  const [newStock, setNewStock] = useState("10");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Sync inputs with items
  useEffect(() => {
    const initial: Record<string, number> = {};
    items.forEach((item) => {
      initial[item.id] = item.stock;
    });
    setStockInputs(initial);
  }, [items]);

  // Fetch Audit Logs, Inquiries, and Branch Requests
  useEffect(() => {
    fetchAuditLogs();
    fetchInquiries();
    fetchBranchRequests();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/admin/audit-logs");
      const json = await res.json();
      if (json.success) {
        setAuditLogs(json.data);
      }
    } catch (e) {
      console.error("Error fetching audit logs", e);
    }
  };

  const fetchInquiries = async () => {
    try {
      const res = await fetch("/api/inquiries");
      const json = await res.json();
      if (json.success) {
        setInquiries(json.data);
      }
    } catch (e) {
      console.error("Error fetching inquiries", e);
    }
  };

  const fetchBranchRequests = async () => {
    try {
      const res = await fetch("/api/branch-requests");
      const json = await res.json();
      if (json.success) {
        setBranchRequests(json.data);
      }
    } catch (e) {
      console.error("Error fetching branch requests", e);
    }
  };

  const handleOpenDispatchModal = (
    req: BranchRequest,
    mode: "approve" | "ship" | "notify" | "view" = "approve"
  ) => {
    setDispatchModalReq(req);
    setDispatchActionType(mode);
    setAutoDecrementStock(true);

    const activeCourier = req.courierName || "GELV Logistics Fleet (Van #1 - Paranaque)";
    setNotifyCourier(activeCourier);
    setNotifyCustomCourier("");
    setNotifyTracking(req.trackingNumber || `TRK-GELV-${Math.floor(10000 + Math.random() * 90000)}`);
    setNotifyETA(
      req.estimatedDeliveryDate ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() + 2);
          return d.toISOString().split("T")[0];
        })()
    );

    if (mode === "approve") {
      setNotifyShippingStatus("Preparing for Dispatch");
      setNotifySubject(`[HQ Approved & Prepared] Material Requisition ${req.id} for ${req.branchName}`);
      setNotifyMessage(
        `Hello ${req.requesterName},\n\nGELV INC Headquarters Supply Chain has reviewed and APPROVED your requisition ${req.id} for ${req.branchName}.\n\n` +
          `• Requisition ID: ${req.id}\n` +
          `• Requested Items: ${req.items.length} line item(s) (${req.items.map((i) => `${i.requestedQuantity}x ${i.itemTitle}`).join(", ")})\n` +
          `• Required By Date: ${req.requiredByDate}\n` +
          `• Initial Status: Materials are being packed at the Central Warehouse and prepared for scheduled dispatch.\n\n` +
          `Thank you,\nHQ Supply Chain Operations (jade.gelv8@gmail.com)`
      );
    } else if (mode === "ship") {
      setNotifyShippingStatus("Shipped Out & En Route");
      setNotifySubject(`[HQ Dispatched & Shipped Out] Requisition ${req.id} is En Route to ${req.branchName}`);
      setNotifyMessage(
        `Hello ${req.requesterName},\n\nYour requested materials for Requisition ${req.id} have been SHIPPED OUT from HQ Warehouse!\n\n` +
          `• Branch Destination: ${req.branchName} (${req.branchCode})\n` +
          `• Courier / Fleet: ${activeCourier}\n` +
          `• Waybill / Tracking No.: ${req.trackingNumber || "TRK-GELV-PENDING"}\n` +
          `• Expected Delivery Date: ${req.estimatedDeliveryDate || "Within 24-48 Hours"}\n\n` +
          `Please have your branch personnel ready to inspect the materials upon arrival.\n\n` +
          `Best regards,\nHQ Supply Chain Operations (jade.gelv8@gmail.com)`
      );
    } else if (mode === "notify") {
      setNotifyShippingStatus(req.shippingStatus || "Preparing for Dispatch");
      setNotifySubject(`[HQ Update] Notice regarding Requisition ${req.id} (${req.branchName})`);
      setNotifyMessage(
        `Hello ${req.requesterName},\n\nThis is an operational update regarding your requisition ${req.id} from GELV INC HQ.\n\n` +
          `• Status: ${req.status}\n` +
          `• Notes: `
      );
    }
  };

  const handleExecuteDispatchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dispatchModalReq) return;

    setIsSubmittingDispatch(true);
    const finalCourier = notifyCustomCourier.trim() || notifyCourier;

    try {
      if (dispatchActionType === "approve") {
        const res = await fetch(`/api/branch-requests/${dispatchModalReq.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "Approved & Dispatched",
            shippingStatus: notifyShippingStatus,
            courierName: finalCourier,
            trackingNumber: notifyTracking.trim(),
            estimatedDeliveryDate: notifyETA,
            autoDecrement: autoDecrementStock,
            notifyRequester: true,
            notificationMessage: notifyMessage.trim(),
            hqNotes: `Approved by HQ on ${new Date().toLocaleDateString()}. Dispatched via ${finalCourier}.`,
            adminName: "HQ Operations Lead (jade.gelv8@gmail.com)",
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Requisition ${dispatchModalReq.id} approved and dispatch notice sent to ${dispatchModalReq.requesterEmail}!`);
          setDispatchModalReq(null);
          await fetchBranchRequests();
          await fetchAuditLogs();
          onRefresh();
        } else {
          alert(data.error || "Failed to approve requisition");
        }
      } else if (dispatchActionType === "ship") {
        const res = await fetch(`/api/branch-requests/${dispatchModalReq.id}/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationType: "Shipped Out",
            title: notifySubject.trim() || `Materials Shipped Out for ${dispatchModalReq.id}`,
            message: notifyMessage.trim(),
            shippingStatus: "Shipped Out & En Route",
            courierName: finalCourier,
            trackingNumber: notifyTracking.trim(),
            estimatedDeliveryDate: notifyETA,
            adminName: "HQ Operations Lead (jade.gelv8@gmail.com)",
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Marked as Shipped Out! Shipment notification sent to ${dispatchModalReq.requesterEmail}`);
          setDispatchModalReq(null);
          await fetchBranchRequests();
          await fetchAuditLogs();
        } else {
          alert(data.error || "Failed to send shipment notice");
        }
      } else if (dispatchActionType === "notify") {
        const res = await fetch(`/api/branch-requests/${dispatchModalReq.id}/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificationType: "General Update",
            title: notifySubject.trim() || `Update on ${dispatchModalReq.id}`,
            message: notifyMessage.trim(),
            shippingStatus: notifyShippingStatus,
            courierName: finalCourier,
            trackingNumber: notifyTracking.trim(),
            estimatedDeliveryDate: notifyETA,
            adminName: "HQ Operations Lead (jade.gelv8@gmail.com)",
          }),
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Notice sent to ${dispatchModalReq.requesterEmail}!`);
          setDispatchModalReq(null);
          await fetchBranchRequests();
          await fetchAuditLogs();
        } else {
          alert(data.error || "Failed to send notice");
        }
      }
    } catch (err: any) {
      alert("Error sending notification: " + err.message);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleUpdateBranchStatus = async (reqId: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/branch-requests/${reqId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          hqNotes: notes || `Updated by HQ Admin on ${new Date().toLocaleString()}`,
          autoDecrement: true,
          notifyRequester: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchBranchRequests();
        await fetchAuditLogs();
        onRefresh();
        showToast(`Updated Requisition ${reqId} status to '${status}'`);
      } else {
        alert(data.error || "Failed to update branch request status");
      }
    } catch (err) {
      console.error("Error updating branch status:", err);
    }
  };

  const handleStockInputChange = (itemId: string, val: number) => {
    setStockInputs((prev) => ({
      ...prev,
      [itemId]: Math.max(0, val),
    }));
  };

  // Open Calibration Modal
  const handleOpenCalibration = (item: AdItem, mode: "add" | "remove" | "recalibrate" = "add") => {
    setCalibratingItem(item);
    setCalibrationMode(mode);
    setAddQty(5);
    setRemoveQty(1);
    setRecalibrateValue(item.stock);
    setReasonPreset("");
    setCustomReason("");
    setShowDeleteConfirmInCalibration(false);
  };

  // Delete Item directly from Calibration Modal
  const handleDeleteFromCalibration = async () => {
    if (!calibratingItem) return;
    setIsDeletingInCalibration(true);
    try {
      await onDeleteItem(calibratingItem.id);
      await fetchAuditLogs();
      showToast(`Permanently deleted '${calibratingItem.title}' from inventory database.`);
      setCalibratingItem(null);
      setShowDeleteConfirmInCalibration(false);
    } catch (err: any) {
      alert("Failed to delete item: " + err.message);
    } finally {
      setIsDeletingInCalibration(false);
    }
  };

  // Execute Calibration / Stock Update from Modal
  const handleApplyCalibration = async () => {
    if (!calibratingItem) return;

    let targetStock = calibratingItem.stock;
    let actionLabel = "";

    if (calibrationMode === "add") {
      const added = Math.max(1, Number(addQty) || 1);
      targetStock = calibratingItem.stock + added;
      actionLabel = `Added +${added} stock units`;
    } else if (calibrationMode === "remove") {
      const removed = Math.max(1, Number(removeQty) || 1);
      targetStock = Math.max(0, calibratingItem.stock - removed);
      actionLabel = `Deducted -${removed} stock units`;
    } else {
      targetStock = Math.max(0, Number(recalibrateValue) || 0);
      const diff = targetStock - calibratingItem.stock;
      actionLabel = `Recalibrated to ${targetStock} units (${diff >= 0 ? "+" : ""}${diff})`;
    }

    const finalReason = customReason.trim() || reasonPreset || `${actionLabel} via Admin Stock Hub`;

    setIsSubmittingCalibration(true);
    try {
      await onUpdateStock(calibratingItem.id, targetStock, finalReason);
      await fetchAuditLogs();
      showToast(`Successfully updated '${calibratingItem.title}': ${actionLabel} (New Stock: ${targetStock})`);
      setCalibratingItem(null);
    } catch (err: any) {
      alert("Error updating stock: " + err.message);
    } finally {
      setIsSubmittingCalibration(false);
    }
  };

  // Quick Instant Inline Increment / Decrement
  const handleQuickStepDelta = async (item: AdItem, delta: number) => {
    const newStock = Math.max(0, item.stock + delta);
    if (newStock === item.stock && delta < 0) {
      showToast(`'${item.title}' is already at 0 units (Sold Out)`, "info");
      return;
    }

    setSavingItemIds((prev) => ({ ...prev, [item.id]: true }));
    const actionLabel = delta > 0 ? `Quick Add +${delta}` : `Quick Remove ${delta}`;
    const reason = `${actionLabel} in Admin Table (${newStock} units available)`;

    try {
      await onUpdateStock(item.id, newStock, reason);
      await fetchAuditLogs();
      showToast(`Updated '${item.title}': ${actionLabel} &bull; New Stock: ${newStock} units`);
    } catch (err: any) {
      alert("Failed to update stock: " + err.message);
    } finally {
      setSavingItemIds((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // Quick Preset Actions
  const handleQuickZeroOut = async (item: AdItem) => {
    if (item.stock === 0) return;
    if (confirm(`Zero out '${item.title}' to 0 units (Mark as Sold Out)?`)) {
      setSavingItemIds((prev) => ({ ...prev, [item.id]: true }));
      try {
        await onUpdateStock(item.id, 0, `Zeroed out stock (Marked as Sold Out / Depleted)`);
        await fetchAuditLogs();
        showToast(`'${item.title}' marked as Sold Out (0 units)`);
      } catch (err: any) {
        alert("Failed to zero out stock: " + err.message);
      } finally {
        setSavingItemIds((prev) => ({ ...prev, [item.id]: false }));
      }
    }
  };

  const handleSaveStock = async (itemId: string) => {
    const targetStock = stockInputs[itemId];
    if (targetStock === undefined) return;

    setSavingItemIds((prev) => ({ ...prev, [itemId]: true }));
    try {
      await onUpdateStock(itemId, targetStock, "Manual Stock Override in Admin DB Portal");
      await fetchAuditLogs();
      showToast(`Saved new stock count (${targetStock} units) to database`);
    } catch (err: any) {
      alert("Failed to update database stock: " + err.message);
    } finally {
      setSavingItemIds((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newThickness) {
      alert("Please fill in required fields: Title, Material Thickness");
      return;
    }

    setIsAdding(true);
    try {
      await onAddItem({
        sku: newSku.trim() ? newSku.trim().toUpperCase() : undefined,
        brand: newBrand.trim() ? newBrand.trim() : undefined,
        title: newTitle,
        category: newCategory,
        dimensions: newDimensions,
        thickness: newThickness,
        dailyPrice: 0,
        dailyImpressions: Number(newImpressions) || 100000,
        stock: Number(newStock),
        imageUrl: newImageUrl || undefined,
        description: newDescription || undefined,
      });

      // Reset form
      setNewSku("");
      setNewBrand("");
      setNewTitle("");
      setNewThickness("13oz Heavy-Duty");
      setNewDescription("");
      setActiveAdminTab("stock");
      await fetchAuditLogs();
      showToast("New material successfully saved to database!");
    } catch (err: any) {
      alert("Error adding material: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `admedia_inventory_db_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Admin Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Database Administrator Console</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Inventory & Stock Management Database
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Manually change available stock levels, add new ad positions, view live transaction logs, or perform full factory database resets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export DB (JSON)</span>
            </button>

            <button
              onClick={async () => {
                if (confirm("Are you sure you want to reset the database back to sample seed data? All custom edits will be restored.")) {
                  await onResetDatabase();
                  await fetchAuditLogs();
                }
              }}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Reset Factory Seed</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation sub-bar */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveAdminTab("stock")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeAdminTab === "stock"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Manual Stock DB Editor</span>
          </button>

          <button
            onClick={() => setActiveAdminTab("add")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeAdminTab === "add"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Material</span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab("logs");
              fetchAuditLogs();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeAdminTab === "logs"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail Logs ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab("inquiries");
              fetchInquiries();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeAdminTab === "inquiries"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Admin Request Forms & Inbox ({inquiries.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab("branch-requests");
              fetchBranchRequests();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeAdminTab === "branch-requests"
                ? "bg-amber-500 text-slate-950 shadow"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branch Requisitions to HQ ({branchRequests.length})</span>
            {branchRequests.filter((b) => b.status === "Pending HQ Review").length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                {branchRequests.filter((b) => b.status === "Pending HQ Review").length} NEW
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content: ENHANCED DIRECT DATABASE STOCK & RECALIBRATION EDITOR */}
      {activeAdminTab === "stock" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900">Direct Database Stock Hub</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px]">
                  Real-Time DB Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quickly add inbound shipments, deduct damaged or written-off material, or recalibrate exact physical counts with audit trail logging.
              </p>
            </div>

            <div className="flex items-center space-x-2 self-start md:self-auto">
              <button
                onClick={onRefresh}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-colors"
                title="Refresh DB"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Refresh DB</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>Total Materials</span>
                <Layers className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{items.length} <span className="text-xs font-normal text-slate-500">SKUs</span></div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                <span>Total Stock Units</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {items.reduce((sum, item) => sum + item.stock, 0)} <span className="text-xs font-normal text-slate-500">Units</span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100/70 transition-colors"
                 onClick={() => setStockStatusFilter("Low")}>
              <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-between">
                <span>Low Stock Alert</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="text-xl font-extrabold text-amber-900 mt-1">
                {items.filter((i) => i.stock > 0 && i.stock <= 2).length} <span className="text-xs font-normal text-amber-700">Need Restock</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl cursor-pointer hover:bg-rose-100/70 transition-colors"
                 onClick={() => setStockStatusFilter("SoldOut")}>
              <div className="text-[11px] font-semibold text-rose-800 flex items-center justify-between">
                <span>Depleted / Sold Out</span>
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className="text-xl font-extrabold text-rose-900 mt-1">
                {items.filter((i) => i.stock === 0).length} <span className="text-xs font-normal text-rose-700">0 Units Left</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Quick Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search material, SKU, brand, category..."
                value={stockSearchQuery}
                onChange={(e) => setStockSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              {stockSearchQuery && (
                <button
                  onClick={() => setStockSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter */}
              <select
                value={stockCategoryFilter}
                onChange={(e) => setStockCategoryFilter(e.target.value)}
                className="py-2 px-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Categories</option>
                <option value="Tarpaulin">Tarpaulin</option>
                <option value="Panaflex">Panaflex</option>
                <option value="Stickers">Stickers</option>
                <option value="Photopapers">Photopapers</option>
                <option value="Paperstocks">Paperstocks</option>
                <option value="Inks">Inks</option>
                <option value="Films">Films</option>
              </select>

              {/* Status Filter */}
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="All">All Stock Levels</option>
                <option value="Low">⚠️ Low Stock (≤ 2)</option>
                <option value="SoldOut">❌ Sold Out (0)</option>
                <option value="Available">✅ In Stock (&gt; 2)</option>
              </select>

              {/* Sort By */}
              <select
                value={stockSortBy}
                onChange={(e) => setStockSortBy(e.target.value as any)}
                className="py-2 px-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="stock-asc">Stock: Low &rarr; High</option>
                <option value="stock-desc">Stock: High &rarr; Low</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Stock Items Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                  <th className="p-3.5">Material</th>
                  <th className="p-3.5">Category / Specs</th>
                  <th className="p-3.5">Thickness</th>
                  <th className="p-3.5 min-w-[160px]">Live Available Stock</th>
                  <th className="p-3.5">Quick Adjust</th>
                  <th className="p-3.5">Recalibration Hub</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-xs">
                          <PackagePlus className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Database is in Clean Slate</h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          All current stocks have been removed. You can now add your materials and substrates manually.
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveAdminTab("add")}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Material Manually</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items
                  .filter((item) => {
                    const matchesSearch =
                      !stockSearchQuery ||
                      item.title.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                      (item.sku && item.sku.toLowerCase().includes(stockSearchQuery.toLowerCase())) ||
                      (item.brand && item.brand.toLowerCase().includes(stockSearchQuery.toLowerCase())) ||
                      item.category.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
                      (item.thickness && item.thickness.toLowerCase().includes(stockSearchQuery.toLowerCase()));

                    const matchesCategory =
                      stockCategoryFilter === "All" || item.category === stockCategoryFilter;

                    const matchesStatus =
                      stockStatusFilter === "All" ||
                      (stockStatusFilter === "Low" && item.stock > 0 && item.stock <= 2) ||
                      (stockStatusFilter === "SoldOut" && item.stock === 0) ||
                      (stockStatusFilter === "Available" && item.stock > 2);

                    return matchesSearch && matchesCategory && matchesStatus;
                  })
                  .sort((a, b) => {
                    if (stockSortBy === "stock-asc") return a.stock - b.stock;
                    if (stockSortBy === "stock-desc") return b.stock - a.stock;
                    if (stockSortBy === "title") return a.title.localeCompare(b.title);
                    return 0;
                  })
                  .map((item) => {
                    const currentVal = stockInputs[item.id] !== undefined ? stockInputs[item.id] : item.stock;
                    const isDirty = currentVal !== item.stock;
                    const isSaving = savingItemIds[item.id];

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Asset Image & Title */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-extrabold text-slate-900 text-sm line-clamp-1">{item.title}</span>
                                {item.brand && (
                                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
                                    {item.brand}
                                  </span>
                                )}
                                {item.sku && (
                                  <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold text-slate-700">
                                    {item.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Category & Specs */}
                        <td className="p-3.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                            {item.category}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {item.dimensions || "Standard Size"}
                          </div>
                        </td>

                        {/* 3. Material Thickness */}
                        <td className="p-3.5">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 font-extrabold text-xs border border-blue-200">
                            <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{item.thickness || "Standard"}</span>
                          </div>
                        </td>

                        {/* 4. Live Available Stock */}
                        <td className="p-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-black text-base text-slate-900 font-mono">{item.stock}</span>
                              <span className="text-[11px] text-slate-500 font-semibold">units</span>
                            </div>

                            <div>
                              {item.stock === 0 ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  <XCircle className="w-3 h-3" />
                                  <span>Sold Out</span>
                                </span>
                              ) : item.stock <= 2 ? (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Low Stock</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Available</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 5. Quick Inline Adjustments (+/- buttons) */}
                        <td className="p-3.5">
                          <div className="flex flex-col space-y-1.5">
                            {/* Stepper with +/- 1 and +/- 5 */}
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleQuickStepDelta(item, -1)}
                                disabled={item.stock <= 0 || isSaving}
                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Quick remove -1 unit"
                              >
                                -1
                              </button>

                              <button
                                onClick={() => handleQuickStepDelta(item, -5)}
                                disabled={item.stock <= 0 || isSaving}
                                className="w-7 h-7 rounded-lg bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Quick remove -5 units"
                              >
                                -5
                              </button>

                              <input
                                type="number"
                                min="0"
                                value={currentVal}
                                onChange={(e) => handleStockInputChange(item.id, parseInt(e.target.value) || 0)}
                                className="w-14 py-1 px-1 text-center font-extrabold text-xs border rounded-lg border-slate-300 focus:border-amber-500 outline-none bg-white font-mono"
                              />

                              <button
                                onClick={() => handleQuickStepDelta(item, 1)}
                                disabled={isSaving}
                                className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200 transition-colors disabled:opacity-40"
                                title="Quick add +1 unit"
                              >
                                +1
                              </button>

                              <button
                                onClick={() => handleQuickStepDelta(item, 5)}
                                disabled={isSaving}
                                className="w-7 h-7 rounded-lg bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center border border-emerald-200 transition-colors disabled:opacity-40"
                                title="Quick add +5 units"
                              >
                                +5
                              </button>
                            </div>

                            {/* Save Staged Edit Button (if manually typed) */}
                            {isDirty && (
                              <button
                                onClick={() => handleSaveStock(item.id)}
                                disabled={isSaving}
                                className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] rounded-lg shadow transition-all flex items-center justify-center space-x-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>{isSaving ? "Saving..." : "Save Custom Stock"}</span>
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 6. Recalibration Hub & Dedicated Modal Trigger */}
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2">
                            {/* Primary Dedicated Calibration Modal Button */}
                            <button
                              onClick={() => handleOpenCalibration(item, "recalibrate")}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-extrabold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5 border border-slate-700"
                              title="Open Stock Recalibration & Adjustment Hub"
                            >
                              <Target className="w-3.5 h-3.5 text-amber-400" />
                              <span>Recalibrate</span>
                            </button>

                            {/* Quick Inflow Restock Button */}
                            <button
                              onClick={() => handleOpenCalibration(item, "add")}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                              title="Add Inbound Shipment (+)"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>

                            {/* Quick Outflow Deduction Button */}
                            <button
                              onClick={() => handleOpenCalibration(item, "remove")}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                              title="Deduct Damaged/Issued Material (-)"
                            >
                              <PackageMinus className="w-4 h-4" />
                            </button>

                            {/* Delete Item */}
                            <button
                              onClick={() => {
                                if (confirm(`Delete '${item.title}' permanently from database?`)) {
                                  onDeleteItem(item.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New Material Tab */}
      {activeAdminTab === "add" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Add New Material to Database</h2>
            <p className="text-xs text-slate-500">Insert a new printing media substrate, dimensions, and live stock units directly into the database.</p>
          </div>

          <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Barcode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Item Code (SKU)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  placeholder="e.g. TARP-13OZ-10X164"
                  className="w-full p-2.5 border rounded-xl font-mono text-xs uppercase tracking-wider font-bold outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white placeholder:normal-case placeholder:font-normal placeholder:tracking-normal"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Store className="w-3.5 h-3.5 text-blue-600" />
                    <span>Brand / Manufacturer</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="e.g. 3M, Avery, Starflex, Roland"
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AdCategory)}
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="Tarpaulin">Tarpaulin</option>
                  <option value="Panaflex">Panaflex</option>
                  <option value="Stickers">Stickers</option>
                  <option value="Photopapers">Photopapers</option>
                  <option value="Paperstocks">Paperstocks</option>
                  <option value="Inks">Inks</option>
                  <option value="Films">Films</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Heavy-Duty Outdoor Tarpaulin (15oz)"
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dimensions / Roll Specs *</label>
                <input
                  type="text"
                  required
                  value={newDimensions}
                  onChange={(e) => setNewDimensions(e.target.value)}
                  placeholder="e.g. 10ft x 20ft or 3.2m x 50m Roll"
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thickness / Substrate Weight *</label>
                <input
                  type="text"
                  required
                  value={newThickness}
                  onChange={(e) => setNewThickness(e.target.value)}
                  placeholder="e.g. 13oz, 15oz, 300gsm, 80 microns, 0.5mm"
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Initial Stock Units *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="10"
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Material Description &amp; Usage Notes</label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="High-tensile heavy-duty flex tarpaulin printed with solvent weather-proof UV inks..."
                className="w-full p-2.5 border rounded-xl font-medium outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isAdding ? "Saving Material..." : "Save New Material to Database"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeAdminTab === "logs" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Database Audit Trail & Stock Logs</h2>
          <p className="text-xs text-slate-500">Every manual admin edit and user Google Account reservation is logged here in real-time.</p>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No database audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-900">{log.itemTitle}</div>
                    <div className="text-slate-600 font-medium">{log.reason}</div>
                    <div className="text-[10px] text-slate-400">By: {log.updatedBy} &bull; {new Date(log.timestamp).toLocaleString()}</div>
                  </div>

                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold font-mono">
                    <span className="text-slate-500">{log.previousStock} units</span>
                    <span className="text-slate-400">&rarr;</span>
                    <span className={log.newStock > log.previousStock ? "text-emerald-600" : "text-amber-600"}>
                      {log.newStock} units
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* User Reservations & PDF Request Forms Tab */}
      {activeAdminTab === "inquiries" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Admin Request Forms & Dispatched PDF Inbox</h2>
              <p className="text-xs text-slate-500">
                All submitted request forms automatically generate PDFs and dispatch copies to all connected site administrators.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200">
              Auto-Dispatched to: admin@gelvinc.com, jade.gelv8@gmail.com
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {inquiries.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No request form PDFs received yet.</p>
            ) : (
              inquiries.map((inq) => {
                const matchedItem = items.find((i) => i.id === inq.itemId);
                const recipients = inq.sentToAdmins || ["admin@gelvinc.com", "jade.gelv8@gmail.com"];

                return (
                  <div key={inq.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{inq.itemTitle}</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>PDF Form Generated</span>
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                          {inq.status}
                        </span>
                      </div>

                      <div className="text-blue-600 font-semibold">
                        Client: {inq.userName} ({inq.userEmail})
                      </div>

                      <div className="text-slate-600">
                        {inq.requestedUnits} unit(s) for {inq.durationDays} day(s) starting {inq.startDate} &bull; Ref: <span className="font-mono">{inq.id}</span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 pt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>Dispatched to admins: {recipients.join(", ")}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4 border-slate-200">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Total Investment</span>
                        <span className="text-base font-extrabold text-slate-900">${inq.totalAmount.toLocaleString()}</span>
                      </div>

                      <button
                        onClick={() => {
                          const pdfRes = generateRequestPDF(inq, matchedItem);
                          pdfRes.doc.save(`Admin_Copy_${pdfRes.filename}`);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>Download Admin PDF</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 5: BRANCH REQUISITIONS TO HQ */}
      {activeAdminTab === "branch-requests" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Branch Requisition Orders to HQ</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-amber-700" />
                  <span>HQ Inbox: jade.gelv8@gmail.com</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Review incoming material requests from regional branches. All requests are routed to <strong>jade.gelv8@gmail.com</strong>. Approving a request auto-dispatches stock and decrements HQ inventory.
              </p>
            </div>

            <button
              onClick={fetchBranchRequests}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors self-start sm:self-auto"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {/* 5 Official Branches Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter by 5 Official Branches
              </span>
              <span className="text-xs text-slate-500">
                Showing {branchRequests.filter((r) => {
                  const matchesBranch = branchFilterBranch === "All" || r.branchName === branchFilterBranch || r.branchCode === branchFilterBranch;
                  const matchesSearch = !branchSearchQuery || r.id.toLowerCase().includes(branchSearchQuery.toLowerCase()) || r.requesterName.toLowerCase().includes(branchSearchQuery.toLowerCase()) || r.items.some(i => i.itemTitle.toLowerCase().includes(branchSearchQuery.toLowerCase()));
                  return matchesBranch && matchesSearch;
                }).length} of {branchRequests.length} requisitions
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setBranchFilterBranch("All")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  branchFilterBranch === "All"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Branches ({branchRequests.length})
              </button>

              {OFFICIAL_BRANCHES.map((b) => {
                const count = branchRequests.filter(
                  (r) => r.branchName === b.name || r.branchCode === b.code
                ).length;
                const isSelected = branchFilterBranch === b.name;
                return (
                  <button
                    key={b.code}
                    type="button"
                    onClick={() => setBranchFilterBranch(b.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{b.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search requisition ref ID, item titles, requester name..."
                value={branchSearchQuery}
                onChange={(e) => setBranchSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            {(() => {
              const filteredList = branchRequests.filter((req) => {
                const matchesBranch =
                  branchFilterBranch === "All" ||
                  req.branchName === branchFilterBranch ||
                  req.branchCode === branchFilterBranch;
                const matchesSearch =
                  !branchSearchQuery ||
                  req.id.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
                  req.requesterName.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
                  req.branchName.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
                  req.items.some((i) => i.itemTitle.toLowerCase().includes(branchSearchQuery.toLowerCase()));
                return matchesBranch && matchesSearch;
              });

              if (filteredList.length === 0) {
                return (
                  <p className="text-xs text-slate-400 py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                    No branch requisitions found matching the selected filter.
                  </p>
                );
              }

              return filteredList.map((req) => {
                const isApproved = req.status === "Approved & Dispatched";
                const isDeclined = req.status === "Declined";
                const isShipped = req.shippingStatus === "Shipped Out & En Route";
                const isDelivered = req.shippingStatus === "Delivered" || req.status === "Completed";
                const notifCount = req.notifications?.length || 0;

                return (
                  <div
                    key={req.id}
                    className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs transition-all hover:border-blue-300"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base">{req.id}</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10px]">
                            {req.branchName} ({req.branchCode})
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              req.priority === "Emergency Restock"
                                ? "bg-red-100 text-red-800"
                                : req.priority === "High Priority"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {req.priority}
                          </span>

                          {/* Live Shipping Status Badge */}
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

                        <div className="text-slate-500 pt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            Requestor: <strong>{req.requesterName}</strong> ({req.requesterRole})
                          </span>
                          <span>&bull;</span>
                          <span>
                            Email: <strong className="text-blue-600">{req.requesterEmail}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Required By: <strong>{req.requiredByDate}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
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

                    {/* Shipping & Courier Info Banner (if shipping active) */}
                    {(req.courierName || req.trackingNumber || req.estimatedDeliveryDate || isShipped) && (
                      <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-indigo-950">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                            <Truck className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-bold text-xs">
                              {req.courierName || "GELV Logistics Fleet"}
                            </div>
                            <div className="text-[11px] text-indigo-700">
                              Waybill / Tracking: <span className="font-mono font-bold">{req.trackingNumber || "Assigned on dispatch"}</span> &bull; Estimated Delivery: <strong>{req.estimatedDeliveryDate || "Upcoming"}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenDispatchModal(req, "ship")}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Update Shipping</span>
                        </button>
                      </div>
                    )}

                    {/* Items requested with HQ stock status */}
                    <div className="space-y-2">
                      <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                        <span>Requested Material Line Items ({req.items.length}):</span>
                        <span className="text-[11px] text-slate-500">Live Central Inventory Check</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {req.items.map((item, idx) => {
                          const hqItem = items.find((i) => i.id === item.itemId);
                          const hasStock = hqItem && hqItem.stock >= item.requestedQuantity;

                          return (
                            <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex justify-between items-center">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {item.priority && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
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
                                  <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px]">{item.category}</span>
                                  {item.brand && (
                                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold text-[9px]">{item.brand}</span>
                                  )}
                                </div>
                                <div className="font-bold text-slate-900">{item.itemTitle}</div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                                  <span>
                                    HQ Warehouse Stock:{" "}
                                    <strong className={hasStock ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                      {hqItem ? `${hqItem.stock} in stock` : "Not in inventory"}
                                    </strong>
                                  </span>
                                  {item.notes && (
                                    <>
                                      <span>&bull;</span>
                                      <span className="italic text-indigo-700">"{item.notes}"</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="bg-amber-100/70 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-xl font-extrabold text-xs shrink-0 ml-2">
                                {item.requestedQuantity} {item.unit || "units"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Purpose / Remarks */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-slate-600 flex justify-between items-center">
                      <div>
                        <strong>Branch Purpose:</strong> {req.purpose || "N/A"}
                      </div>
                      {req.lastNotifiedAt && (
                        <div className="text-[11px] text-slate-400">
                          Last notified: {new Date(req.lastNotifiedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>

                    {/* Notification Timeline Snippet (if any notices sent) */}
                    {notifCount > 0 && (
                      <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-bold text-blue-900 text-[11px]">
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            <span>Notification History ({notifCount} notice{notifCount > 1 ? "s" : ""} dispatched):</span>
                          </div>
                          <button
                            onClick={() => handleOpenDispatchModal(req, "view")}
                            className="text-[10px] text-blue-600 hover:underline font-bold"
                          >
                            View All Notices &rarr;
                          </button>
                        </div>
                        {req.notifications?.slice(0, 1).map((n) => (
                          <div key={n.id} className="text-[11px] text-slate-600 bg-white p-2 rounded-xl border border-blue-100 flex items-center justify-between">
                            <div className="truncate pr-2">
                              <strong className="text-blue-800">[{n.type}]</strong> {n.title} - <span className="text-slate-500">{n.message}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons for HQ Admin */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const pdfRes = generateBranchRequestPDF(req);
                            pdfRes.doc.save(`HQ_Copy_${pdfRes.filename}`);
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-400" />
                          <span>Download Slip PDF</span>
                        </button>

                        <button
                          onClick={() => handleOpenDispatchModal(req, "notify")}
                          className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center space-x-1.5"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Send Notice to Requestor</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isApproved && (
                          <button
                            onClick={() => handleOpenDispatchModal(req, "approve")}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve &amp; Notify Requestor</span>
                          </button>
                        )}

                        {isApproved && !isDelivered && (
                          <button
                            onClick={() => handleOpenDispatchModal(req, "ship")}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center space-x-1.5"
                          >
                            <Truck className="w-4 h-4" />
                            <span>{isShipped ? "Update Shipping Info" : "Mark Shipped & Dispatch"}</span>
                          </button>
                        )}

                        {!isDeclined && !isApproved && (
                          <button
                            onClick={() => {
                              const note = prompt("Enter reason for declining this request:");
                              if (note !== null) {
                                handleUpdateBranchStatus(req.id, "Declined", note || "Declined by HQ Admin.");
                              }
                            }}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* DISPATCH, SHIPPING & NOTIFICATION MODAL */}
      {dispatchModalReq && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                  {dispatchActionType === "approve" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : dispatchActionType === "ship" ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">
                    {dispatchActionType === "approve"
                      ? "Approve Requisition & Notify Requestor"
                      : dispatchActionType === "ship"
                      ? "Mark Shipped & Send Dispatch Notice"
                      : dispatchActionType === "notify"
                      ? "Send HQ Supply Notice"
                      : "Notification History & Dispatch Details"}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Requisition Ref: <span className="font-mono text-amber-400 font-bold">{dispatchModalReq.id}</span> &bull; {dispatchModalReq.branchName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDispatchModalReq(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Action Tabs in Modal */}
            <div className="flex border-b border-slate-100 bg-slate-50 px-5 pt-3 gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => {
                  setDispatchActionType("approve");
                  setNotifyShippingStatus("Preparing for Dispatch");
                  setNotifySubject(`[HQ Approved & Prepared] Material Requisition ${dispatchModalReq.id}`);
                }}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  dispatchActionType === "approve"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Approve &amp; Prepare</span>
              </button>

              <button
                onClick={() => {
                  setDispatchActionType("ship");
                  setNotifyShippingStatus("Shipped Out & En Route");
                  setNotifySubject(`[HQ Shipped Out] Requisition ${dispatchModalReq.id} is En Route`);
                }}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  dispatchActionType === "ship"
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>2. Mark Shipped Out</span>
              </button>

              <button
                onClick={() => setDispatchActionType("notify")}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  dispatchActionType === "notify"
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>3. Direct Memo</span>
              </button>

              <button
                onClick={() => setDispatchActionType("view")}
                className={`pb-2.5 px-3 font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  dispatchActionType === "view"
                    ? "border-slate-800 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>4. Audit History ({dispatchModalReq.notifications?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto text-xs">
              {/* Recipient & Branch Info Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">
                    Recipient / Requestor
                  </div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {dispatchModalReq.requesterName} <span className="font-normal text-xs text-slate-600">({dispatchModalReq.requesterRole})</span>
                  </div>
                  <div className="text-xs text-blue-700 font-mono font-medium">
                    {dispatchModalReq.requesterEmail}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Destination Branch:</div>
                  <div className="font-bold text-slate-800">{dispatchModalReq.branchName}</div>
                  <div className="text-[11px] text-slate-500">Required By: <strong>{dispatchModalReq.requiredByDate}</strong></div>
                </div>
              </div>

              {/* VIEW LOGS TAB */}
              {dispatchActionType === "view" ? (
                <div className="space-y-3">
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                    <span>Dispatched Notifications &amp; Timeline:</span>
                    <span className="text-slate-500">{dispatchModalReq.notifications?.length || 0} notices sent</span>
                  </div>

                  {(!dispatchModalReq.notifications || dispatchModalReq.notifications.length === 0) ? (
                    <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400">
                      No notifications have been recorded for this requisition yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dispatchModalReq.notifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-extrabold rounded-md text-[10px]">
                              {notif.type}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(notif.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 text-xs">{notif.title}</div>
                          <p className="text-slate-600 whitespace-pre-line leading-relaxed">{notif.message}</p>
                          <div className="text-[10px] text-slate-400 border-t pt-1 mt-1 border-slate-200">
                            Sent by: {notif.sentBy} &bull; To: {notif.recipientEmail}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT & SUBMIT TAB */
                <form onSubmit={handleExecuteDispatchSubmit} className="space-y-4">
                  {/* Shipping & Dispatch Configuration */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Truck className="w-4 h-4 text-blue-600" />
                        <span>Logistics &amp; Shipping Dispatch Details</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Shipping Status Stage
                        </label>
                        <select
                          value={notifyShippingStatus}
                          onChange={(e: any) => setNotifyShippingStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Preparing for Dispatch">📦 Preparing for Dispatch (HQ Warehouse)</option>
                          <option value="Shipped Out & En Route">🚚 Shipped Out &amp; En Route</option>
                          <option value="Ready for Pickup">🏢 Ready for Branch Pickup</option>
                          <option value="Delivered">✅ Delivered to Branch</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Estimated Delivery Date
                        </label>
                        <input
                          type="date"
                          value={notifyETA}
                          onChange={(e) => setNotifyETA(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Courier / Delivery Fleet
                        </label>
                        <select
                          value={notifyCourier}
                          onChange={(e) => setNotifyCourier(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="GELV Logistics Fleet (Van #1 - Paranaque)">GELV Logistics Fleet (Van #1 - Paranaque)</option>
                          <option value="GELV Logistics Fleet (Van #4 - Rizal/East)">GELV Logistics Fleet (Van #4 - Rizal/East)</option>
                          <option value="Lalamove 4-Wheel MPV Fleet">Lalamove 4-Wheel MPV Fleet</option>
                          <option value="Grab Express High-Capacity Delivery">Grab Express High-Capacity Delivery</option>
                          <option value="J&T Express Commercial Cargo">J&T Express Commercial Cargo</option>
                          <option value="Branch Designated Courier Pickup">Branch Designated Courier Pickup</option>
                          <option value="Other">Other / Custom Logistics</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Waybill / Tracking Number
                        </label>
                        <input
                          type="text"
                          value={notifyTracking}
                          onChange={(e) => setNotifyTracking(e.target.value)}
                          placeholder="e.g. TRK-GELV-88210"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    {notifyCourier === "Other" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Custom Courier Name &amp; Contact
                        </label>
                        <input
                          type="text"
                          value={notifyCustomCourier}
                          onChange={(e) => setNotifyCustomCourier(e.target.value)}
                          placeholder="e.g. Independent Transport Lead - Mario (0917-123-4567)"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Stock Decrement Checkbox (for Approve mode) */}
                  {dispatchActionType === "approve" && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="autoDecrement"
                        checked={autoDecrementStock}
                        onChange={(e) => setAutoDecrementStock(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <label htmlFor="autoDecrement" className="text-xs text-emerald-950 font-bold cursor-pointer">
                        Automatically deduct requested item quantities ({dispatchModalReq.items.reduce((s, i) => s + i.requestedQuantity, 0)} total units) from Central HQ Warehouse stock
                      </label>
                    </div>
                  )}

                  {/* Notification Content */}
                  <div className="space-y-3">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>Email &amp; In-App Notification to Requestor</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Dispatched to: {dispatchModalReq.requesterEmail}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Notification Subject Line
                      </label>
                      <input
                        type="text"
                        value={notifySubject}
                        onChange={(e) => setNotifySubject(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Message Body
                      </label>
                      <textarea
                        rows={4}
                        value={notifyMessage}
                        onChange={(e) => setNotifyMessage(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                        required
                      />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    {/* External Mailto Link */}
                    <a
                      href={`mailto:${encodeURIComponent(dispatchModalReq.requesterEmail)}?cc=admin@gelvinc.com,jade.gelv8@gmail.com&subject=${encodeURIComponent(
                        notifySubject
                      )}&body=${encodeURIComponent(notifyMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center space-x-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Open in Gmail / Email App</span>
                    </a>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setDispatchModalReq(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmittingDispatch}
                        className={`px-5 py-2 text-white font-extrabold text-xs rounded-xl shadow transition-all flex items-center space-x-2 ${
                          dispatchActionType === "approve"
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : dispatchActionType === "ship"
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {isSubmittingDispatch ? (
                          <>
                            <RefreshCcw className="w-4 h-4 animate-spin" />
                            <span>Dispatching Notice...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>
                              {dispatchActionType === "approve"
                                ? "Approve & Send Notification"
                                : dispatchActionType === "ship"
                                ? "Mark Shipped & Send Notice"
                                : "Send Notice to Requestor"}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED STOCK CALIBRATION & ADJUSTMENT MODAL */}
      {calibratingItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Stock Recalibration &amp; Adjustment Hub</h3>
                  <p className="text-[11px] text-slate-400">Manage inbound deliveries, write-offs, or audit physical stock</p>
                </div>
              </div>

              <button
                onClick={() => setCalibratingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Asset Profile Card */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center space-x-4">
              <img
                src={calibratingItem.imageUrl}
                alt={calibratingItem.title}
                className="w-14 h-14 rounded-2xl object-cover bg-white border border-slate-200 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                    {calibratingItem.category}
                  </span>
                  {calibratingItem.brand && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 font-bold text-[10px]">
                      {calibratingItem.brand}
                    </span>
                  )}
                  {calibratingItem.sku && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold text-[10px]">
                      {calibratingItem.sku}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 truncate mt-0.5">
                  {calibratingItem.title}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                  <span>Current DB Stock: <strong className="text-slate-900 font-mono">{calibratingItem.stock} units</strong></span>
                  <span>&bull;</span>
                  <span>Dimensions: <strong className="text-slate-900">{calibratingItem.dimensions || "Standard"}</strong></span>
                </div>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setCalibrationMode("add");
                    setReasonPreset("Inbound Delivery Shipment");
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
                    calibrationMode === "add"
                      ? "bg-white text-emerald-700 shadow-sm border border-emerald-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  <span>➕ Add Inflow</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalibrationMode("remove");
                    setReasonPreset("Damaged / Defective Roll Written Off");
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
                    calibrationMode === "remove"
                      ? "bg-white text-rose-700 shadow-sm border border-rose-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <PackageMinus className="w-4 h-4 text-rose-600" />
                  <span>➖ Deduct Outflow</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCalibrationMode("recalibrate");
                    setRecalibrateValue(calibratingItem.stock);
                    setReasonPreset("Physical Warehouse Audit Recalibration");
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
                    calibrationMode === "recalibrate"
                      ? "bg-white text-slate-900 shadow-sm border border-amber-300"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Target className="w-4 h-4 text-amber-500" />
                  <span>🎯 Recalibrate</span>
                </button>
              </div>

              {/* TAB 1: ADD STOCK */}
              {calibrationMode === "add" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Units to Add (Inbound Restock):</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={addQty}
                        onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 p-2.5 text-center font-extrabold text-base border-2 rounded-xl border-emerald-300 focus:border-emerald-500 outline-none text-emerald-800"
                      />
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {[1, 2, 5, 10, 20, 50, 100].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAddQty(preset)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                              addQty === preset
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            +{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculation Preview */}
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-950">
                    <div>
                      <span className="text-[11px] text-emerald-700 block">Computed Balance</span>
                      <span className="font-semibold">
                        {calibratingItem.stock} current + <strong className="text-emerald-700 font-extrabold font-mono">+{addQty} added</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-700 block">New DB Stock</span>
                      <span className="text-xl font-black font-mono text-emerald-700">
                        {calibratingItem.stock + addQty} units
                      </span>
                    </div>
                  </div>

                  {/* Reason Presets */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Restock Reason Preset:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Inbound Delivery Shipment",
                        "Production Batch Finished",
                        "Regional Branch Return",
                        "Unused Material Check-in",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReasonPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            reasonPreset === preset
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REMOVE / DEDUCT STOCK */}
              {calibrationMode === "remove" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Units to Deduct / Write Off:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={calibratingItem.stock}
                        value={removeQty}
                        onChange={(e) => setRemoveQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 p-2.5 text-center font-extrabold text-base border-2 rounded-xl border-rose-300 focus:border-rose-500 outline-none text-rose-800"
                      />
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {[1, 2, 5, 10, 20, 50].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRemoveQty(preset)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold text-xs border transition-all ${
                              removeQty === preset
                                ? "bg-rose-600 text-white border-rose-600"
                                : "bg-slate-100 hover:bg-rose-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            -{preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Calculation Preview */}
                  <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-950">
                    <div>
                      <span className="text-[11px] text-rose-700 block">Computed Balance</span>
                      <span className="font-semibold">
                        {calibratingItem.stock} current - <strong className="text-rose-700 font-extrabold font-mono">-{removeQty} deducted</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-rose-700 block">New DB Stock</span>
                      <span className="text-xl font-black font-mono text-rose-700">
                        {Math.max(0, calibratingItem.stock - removeQty)} units
                      </span>
                    </div>
                  </div>

                  {/* Reason Presets */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deduction Reason Preset:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Damaged / Defective Roll Written Off",
                        "Sample Strip / Test Print Cut",
                        "Dispatched to Field Crew",
                        "Scrapped / Expired Material",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReasonPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            reasonPreset === preset
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EXACT RECALIBRATION (AUDIT) */}
              {calibrationMode === "recalibrate" && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1.5">Verified Physical Stock Count:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={recalibrateValue}
                        onChange={(e) => setRecalibrateValue(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-28 p-2.5 text-center font-extrabold text-lg border-2 rounded-xl border-amber-400 focus:border-amber-500 outline-none text-slate-900 font-mono"
                      />
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        <button
                          type="button"
                          onClick={() => setRecalibrateValue(0)}
                          className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                        >
                          Zero (0)
                        </button>
                        {[10, 25, 50, 100, 250, 500].map((units) => (
                          <button
                            key={units}
                            type="button"
                            onClick={() => setRecalibrateValue(units)}
                            className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200"
                          >
                            {units} Units
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Variance Preview */}
                  {(() => {
                    const diff = recalibrateValue - calibratingItem.stock;
                    return (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-950">
                        <div>
                          <span className="text-[11px] text-amber-800 block">Inventory Count Variance</span>
                          <span className="font-semibold">
                            {calibratingItem.stock} &rarr; <strong className="font-mono text-slate-900">{recalibrateValue} units</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-amber-800 block">Discrepancy Delta</span>
                          <span className={`text-base font-extrabold font-mono ${diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {diff >= 0 ? `+${diff}` : diff} units
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reason Presets */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Audit Reason Preset:</label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Physical Warehouse Audit Recalibration",
                        "Quarterly Inventory Reconciliation",
                        "Discrepancy Correction",
                        "Annual Cycle Count Audit",
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReasonPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            reasonPreset === preset
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Audit Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 text-xs">Custom Note / PO Reference (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Verified by Warehouse Admin on Bay 3, PO #8821"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons & Delete Item Control */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                {/* Delete Item from DB button / confirmation */}
                <div>
                  {showDeleteConfirmInCalibration ? (
                    <div className="flex items-center space-x-2 bg-rose-50 p-1.5 rounded-xl border border-rose-200 animate-in fade-in">
                      <span className="text-[11px] font-bold text-rose-800">Delete permanently?</span>
                      <button
                        type="button"
                        onClick={handleDeleteFromCalibration}
                        disabled={isDeletingInCalibration}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-colors"
                      >
                        {isDeletingInCalibration ? "Deleting..." : "Yes, Delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmInCalibration(false)}
                        className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirmInCalibration(true)}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 font-bold text-xs flex items-center space-x-1.5 transition-all"
                      title="Permanently remove this material item from the database list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Item from List</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCalibratingItem(null);
                      setShowDeleteConfirmInCalibration(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyCalibration}
                    disabled={isSubmittingCalibration}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center space-x-2 ${
                      calibrationMode === "add"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : calibrationMode === "remove"
                        ? "bg-rose-600 hover:bg-rose-700 text-white"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSubmittingCalibration
                        ? "Applying to DB..."
                        : calibrationMode === "add"
                        ? `Confirm & Add +${addQty} Units`
                        : calibrationMode === "remove"
                        ? `Confirm & Deduct -${removeQty} Units`
                        : `Confirm & Recalibrate to ${recalibrateValue} Units`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-200 leading-snug">
            {toastMessage.text}
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs font-bold pl-2"
          >
            ✕
          </button>
        </div>
      )}

    </div>
  );
};
