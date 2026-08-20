import React from "react";
import { AdItem } from "../types";
import {
  X,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Ruler,
  Package,
  Sparkles,
  Barcode,
} from "lucide-react";

interface ItemDetailModalProps {
  item: AdItem | null;
  onClose: () => void;
  onSubmitInquiry?: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  const isSoldOut = item.stock === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header Image Display */}
        <div className="relative h-64 sm:h-80 w-full bg-slate-950">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-800 transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title & Badges Overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                {item.category}
              </span>

              {item.brand && (
                <span className="bg-white/95 text-slate-900 text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                  Brand: {item.brand}
                </span>
              )}

              {item.sku && (
                <span className="bg-slate-900/90 text-amber-400 border border-amber-400/40 text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex items-center space-x-1">
                  <Barcode className="w-3.5 h-3.5 text-amber-400" />
                  <span>SKU: {item.sku}</span>
                </span>
              )}
              
              {isSoldOut ? (
                <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center space-x-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Sold Out</span>
                </span>
              ) : item.stock <= 2 ? (
                <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-lg flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Low Stock ({item.stock} left)</span>
                </span>
              ) : (
                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-lg flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>In Stock ({item.stock} available)</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{item.title}</h2>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          {/* Asset Description & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Material Overview</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{item.description}</p>
              
              <div className="pt-2 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                  <Ruler className="w-4 h-4 text-blue-600" />
                  <span><strong className="text-slate-900">Dimensions:</strong> {item.dimensions}</span>
                </div>
                {item.thickness && (
                  <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-indigo-900">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span><strong className="text-indigo-950">Thickness:</strong> {item.thickness}</span>
                  </div>
                )}
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span><strong className="text-slate-900">Available Stock:</strong> {item.stock} {item.stock === 1 ? "Unit" : "Units"}</span>
                </div>
              </div>
            </div>

            {/* Material Size (Feet) & Stock Status card */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg">
              <div>
                <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium mb-1">
                  <Ruler className="w-3.5 h-3.5 text-blue-400" />
                  <span>Material Size (Feet)</span>
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-blue-400 block leading-tight">
                  {item.dimensions}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Physical Substrate Specifications</span>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <span className="text-xs text-slate-400 font-medium block">Current Availability</span>
                <span className="text-xl font-extrabold text-emerald-400">{item.stock} {item.stock === 1 ? "Unit Available" : "Units Available"}</span>
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Technical & Exposure Specifications</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {item.specs.resolution && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Display / Print Resolution</span>
                  <span className="text-slate-900 font-bold">{item.specs.resolution}</span>
                </div>
              )}

              {item.specs.operatingHours && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Durability / Schedule</span>
                  <span className="text-slate-900 font-bold">{item.specs.operatingHours}</span>
                </div>
              )}

              {item.specs.minLoopFrequency && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Rotation / Material Grade</span>
                  <span className="text-slate-900 font-bold">{item.specs.minLoopFrequency}</span>
                </div>
              )}

              {item.specs.targetDemographic && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block font-medium">Substrate Properties</span>
                  <span className="text-slate-900 font-bold">{item.specs.targetDemographic}</span>
                </div>
              )}
            </div>
          </div>

          {/* Branch Requisition Guidance Notice */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Need to Order or Requisition this Material?</span>
              </h4>
              <p className="text-xs text-blue-800">
                Use the <strong>Branch Request Portal</strong> to submit formal requisition forms and auto-generate signed PDF orders.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition-colors shrink-0 shadow"
            >
              Close Specifications
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
