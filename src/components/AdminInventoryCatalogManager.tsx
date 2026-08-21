import React, { useState, useMemo } from "react";
import { AdItem, AdCategory } from "../types";
import { OFFICIAL_BRANCHES } from "../data/branches";
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Building2,
  DollarSign,
  Tag,
  ExternalLink,
  ChevronDown,
  Sparkles,
  RefreshCcw,
  Eye,
  Barcode
} from "lucide-react";

interface AdminInventoryCatalogManagerProps {
  items: AdItem[];
  onAddItem: (newItemData: Partial<AdItem>) => Promise<void>;
  onUpdateStock: (itemId: string, newStock: number, reason?: string) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onOpenCalibration: (item: AdItem) => void;
  onRefresh: () => void;
}

const CATEGORIES: (AdCategory | 'All')[] = [
  'All',
  'Tarpaulin',
  'Panaflex',
  'Stickers',
  'Photopapers',
  'Paperstocks',
  'Inks',
  'Films'
];

export const AdminInventoryCatalogManager: React.FC<AdminInventoryCatalogManagerProps> = ({
  items,
  onAddItem,
  onUpdateStock,
  onDeleteItem,
  onOpenCalibration,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [stockStatus, setStockStatus] = useState<"All" | "Available" | "Low Stock" | "Sold Out">("All");

  // Edit / Quick Update Modal
  const [editingItem, setEditingItem] = useState<AdItem | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "Tarpaulin" as AdCategory,
    location: "Sucat Door 11 (Main HQ)",
    dimensions: "",
    thickness: "",
    brand: "",
    unit: "rolls",
    dailyPrice: 0,
    monthlyPrice: 0,
    stock: 0,
    dailyReach: 0,
    description: "",
    sku: "",
  });

  // Open Item editor
  const handleOpenEdit = (item: AdItem) => {
    setEditingItem(item);
    setEditFormData({
      title: item.title,
      category: item.category,
      location: item.location,
      dimensions: item.dimensions || "",
      thickness: item.thickness || "",
      brand: item.brand || "",
      unit: item.unit || "rolls",
      dailyPrice: item.dailyPrice,
      monthlyPrice: item.monthlyPrice || item.dailyPrice * 30,
      stock: item.stock,
      dailyReach: item.dailyReach,
      description: item.description,
      sku: item.sku || "",
    });
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsUpdating(true);

    try {
      // Calculate updated status
      let calculatedStatus: AdItem["status"] = "Available";
      if (editFormData.stock === 0) calculatedStatus = "Sold Out";
      else if (editFormData.stock <= 2) calculatedStatus = "Low Stock";

      const updatedPayload = {
        ...editFormData,
        status: calculatedStatus,
      };

      const res = await fetch(`/api/admin/inventory/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPayload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to update catalog asset");

      setEditingItem(null);
      onRefresh();
    } catch (err: any) {
      alert("Error saving catalog item: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchesBranch = selectedBranch === "All" || item.location.toLowerCase().includes(selectedBranch.toLowerCase());
      const matchesStatus = stockStatus === "All" || item.status === stockStatus;

      return matchesSearch && matchesCat && matchesBranch && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedBranch, stockStatus]);

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>GELV INC Master Substrates & Media</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Maintain Inventory Catalogs
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Configure product specifications, dimension sizes, pricing formulas, SKU barcodes, and branch warehouse allocations for all 7 advertising material lines.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Refresh Catalog</span>
            </button>
          </div>
        </div>

        {/* Quick Catalog Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Catalog SKUs</span>
            <span className="text-xl font-black text-white mt-1 block">{items.length} Products</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-amber-400 block uppercase tracking-wider">Total Quantity in DB</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">
              {items.reduce((acc, i) => acc + (i.stock || 0), 0)} Units
            </span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">Active Material Lines</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">7 Substrate Types</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-rose-400 block uppercase tracking-wider">Low / Depleted Stock</span>
            <span className="text-xl font-black text-rose-400 mt-1 block">
              {items.filter(i => i.stock <= 2).length} SKUs
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, substrate title, brand, dimensions..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Branch Allocation */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Warehouses / Branches</option>
              <option value="Door 11" className="bg-slate-900">Main HQ Door 11</option>
              <option value="Door 0" className="bg-slate-900">Great Print Door 0</option>
              <option value="BF Homes" className="bg-slate-900">VG Formera (BF Homes)</option>
              <option value="Kabihasnan" className="bg-slate-900">Kulay Studio</option>
              <option value="Taytay" className="bg-slate-900">Taytay Regional</option>
            </select>
          </div>

          {/* Stock Level */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Stock Statuses</option>
              <option value="Available" className="bg-slate-900">Available (&gt; 2)</option>
              <option value="Low Stock" className="bg-slate-900">Low Stock (1-2)</option>
              <option value="Sold Out" className="bg-slate-900">Sold Out (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* CATALOG GRID / LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500">
            <Layers className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
            <p className="font-bold">No catalog items match your search and filter criteria.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between transition-all group"
            >
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">
                      <Tag className="w-3 h-3" />
                      <span>{item.category}</span>
                    </span>
                    <span className="ml-2 font-mono text-[10px] text-slate-500 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.sku || item.id}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.stock === 0
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : item.stock <= 2
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {item.stock === 0 ? "Depleted" : `${item.stock} in Stock`}
                  </span>
                </div>

                <h3 className="font-extrabold text-white text-sm leading-snug group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                {/* Specs Chips */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Dimensions:</span>
                    <span className="font-mono text-slate-200 font-semibold">{item.dimensions || "Standard Sheet"}</span>
                  </div>
                  {item.thickness && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Thickness / Weight:</span>
                      <span className="text-slate-200 font-semibold">{item.thickness}</span>
                    </div>
                  )}
                  {item.brand && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Brand / Origin:</span>
                      <span className="text-slate-200 font-semibold">{item.brand}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Assigned Location:</span>
                    <span className="text-amber-300 font-semibold">{item.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Unit Rate:</span>
                    <span className="text-emerald-400 font-black text-xs font-mono">
                      ₱{item.dailyPrice.toLocaleString()} / {item.unit || "roll"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-800">
                <button
                  onClick={() => onOpenCalibration(item)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adjust Stock</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Catalog Specifications"
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete '${item.title}' from catalog master database?`)) {
                        onDeleteItem(item.id);
                      }
                    }}
                    title="Delete Catalog Item"
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT CATALOG ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Edit Catalog Specifications</h3>
                  <p className="text-xs text-slate-400">SKU: {editingItem.sku || editingItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1.5">Material / Substrate Title *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Category *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as AdCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">SKU / Code</label>
                  <input
                    type="text"
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Dimensions</label>
                  <input
                    type="text"
                    value={editFormData.dimensions}
                    onChange={(e) => setEditFormData({ ...editFormData, dimensions: e.target.value })}
                    placeholder="e.g. 10ft x 164ft"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Thickness / Weight</label>
                  <input
                    type="text"
                    value={editFormData.thickness}
                    onChange={(e) => setEditFormData({ ...editFormData, thickness: e.target.value })}
                    placeholder="e.g. 13oz Frontlit"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Brand / Source</label>
                  <input
                    type="text"
                    value={editFormData.brand}
                    onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    placeholder="e.g. Avery Dennison"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Warehouse Location</label>
                  <input
                    type="text"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Unit Price (PHP)</label>
                  <input
                    type="number"
                    value={editFormData.dailyPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, dailyPrice: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Current Stock Available</label>
                  <input
                    type="number"
                    value={editFormData.stock}
                    onChange={(e) => setEditFormData({ ...editFormData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1.5">Catalog Description</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUpdating ? "Updating Master DB..." : "Save Catalog Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
