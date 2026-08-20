import React, { useState } from "react";
import { AdItem, AdCategory } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Layers,
  ArrowUpDown,
  Ruler,
  Barcode,
} from "lucide-react";

interface CatalogViewProps {
  items: AdItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  onSelectItem: (item: AdItem) => void;
  onQuickStockChange: (itemId: string, newStock: number) => void;
  onRefresh: () => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

const CATEGORIES: (AdCategory | "All")[] = [
  "All",
  "Tarpaulin",
  "Panaflex",
  "Stickers",
  "Photopapers",
  "Paperstocks",
  "Inks",
  "Films",
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  items,
  isLoading,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedCity,
  setSelectedCity,
  inStockOnly,
  setInStockOnly,
  onSelectItem,
  onQuickStockChange,
  onRefresh,
  autoRefresh,
  setAutoRefresh,
}) => {
  const { user, isAdmin, setShowAuthModal } = useAuth();
  const [sortBy, setSortBy] = useState<"relevance" | "stock-desc" | "title-asc">("relevance");

  // Sorted list
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "stock-desc") return b.stock - a.stock;
    if (sortBy === "title-asc") return a.title.localeCompare(b.title);
    return 0;
  });

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = items.filter((i) => i.stock > 0 && i.stock <= 2).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter and Control Toolbar with Integrated Search */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Search Bar on the Filter */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            id="catalog-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by material, dimensions, category, or specifications..."
            className="w-full pl-12 pr-28 py-3.5 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm sm:text-base rounded-2xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <div className="absolute right-3 flex items-center space-x-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-200 font-medium transition-colors"
              >
                Clear
              </button>
            )}
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60 font-mono">
              Live Search
            </span>
          </div>
        </div>

        {/* Category Pills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Media Category Filter</span>
            </label>
            <span className="text-xs font-semibold text-slate-500">{sortedItems.length} items found</span>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* In-Stock, Sort, and Sync controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* In-Stock Only Toggle */}
            <label className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="font-semibold text-slate-700">In-Stock Only</span>
            </label>

            {/* Sort By Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
              >
                <option value="relevance">Default Order</option>
                <option value="stock-desc">Stock Available</option>
                <option value="title-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Sync Controls */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border transition-all ${
                autoRefresh
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
              <span className="font-semibold">{autoRefresh ? "Auto Sync On (5s)" : "Auto Sync Off"}</span>
            </button>

            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Manual Sync Database"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Item Grid */}
      {isLoading && items.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Querying live inventory database...</p>
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matching inventory items found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try loosening your search terms or unchecking 'In-Stock Only'.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedCity("All");
              setInStockOnly(false);
            }}
            className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item) => {
            const isSoldOut = item.stock === 0;
            const isLowStock = item.stock > 0 && item.stock <= 2;

            return (
              <div
                key={item.id}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden hover:shadow-xl ${
                  isSoldOut
                    ? "border-slate-200 opacity-90"
                    : isLowStock
                    ? "border-amber-200 hover:border-amber-400"
                    : "border-slate-200 hover:border-blue-400"
                }`}
              >
                {/* Image Header with Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20"></div>

                  {/* Category & SKU Pill */}
                  <div className="absolute top-3 left-3 flex items-center space-x-1.5 flex-wrap gap-y-1">
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/60 shadow">
                      {item.category}
                    </span>
                    {item.brand && (
                      <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow border border-slate-200">
                        {item.brand}
                      </span>
                    )}
                    {item.sku && (
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-lg shadow border border-amber-300 flex items-center space-x-1">
                        <Barcode className="w-3 h-3 text-slate-900" />
                        <span>{item.sku}</span>
                      </span>
                    )}
                  </div>

                  {/* Stock Status Badge */}
                  <div className="absolute top-3 right-3">
                    {isSoldOut ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Sold Out</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-500/90 backdrop-blur-md text-slate-950 text-[11px] font-extrabold shadow">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Low Stock ({item.stock} Left)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-bold shadow">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.stock} Available</span>
                      </span>
                    )}
                  </div>

                  {/* Material Size in Feet Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-blue-300 flex items-center space-x-1.5 shadow-lg">
                      <Ruler className="w-4 h-4 text-blue-400" />
                      <span>{item.dimensions}</span>
                    </div>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    {/* Material Size and Thickness Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 text-xs bg-blue-50/90 border border-blue-200/80 px-2.5 py-1.5 rounded-xl min-w-0">
                        <Ruler className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-500 block leading-tight font-medium">Size</span>
                          <span className="font-extrabold text-blue-900 text-xs truncate block">{item.dimensions}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-xs bg-indigo-50/90 border border-indigo-200/80 px-2.5 py-1.5 rounded-xl min-w-0">
                        <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-slate-500 block leading-tight font-medium">Thickness</span>
                          <span className="font-extrabold text-indigo-900 text-xs truncate block">{item.thickness || "Standard"}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Available Stock Indicator */}
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-100 text-xs">
                    <span className="text-slate-600 font-medium">Available Stock:</span>
                    <span className={`font-bold ${isSoldOut ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-emerald-700"}`}>
                      {item.stock} {item.stock === 1 ? "Unit Available" : "Units Available"}
                    </span>
                  </div>

                  {/* Quick Admin Direct Stock Controls (If in Admin Mode) */}
                  {isAdmin && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                        <span>Database Stock Override:</span>
                        <span className="text-xs font-extrabold text-amber-700">{item.stock}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickStockChange(item.id, Math.max(0, item.stock - 1));
                          }}
                          disabled={item.stock === 0}
                          className="flex-1 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold text-xs hover:bg-amber-100 transition-colors disabled:opacity-40 flex items-center justify-center space-x-1"
                        >
                          <Minus className="w-3 h-3" />
                          <span>-1 Stock</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickStockChange(item.id, item.stock + 1);
                          }}
                          className="flex-1 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold text-xs hover:bg-amber-400 transition-colors flex items-center justify-center space-x-1 shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+1 Stock</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Material Specifications</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
