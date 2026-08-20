import React, { useState } from "react";
import { AdItem } from "../types";
import { useAuth } from "../context/AuthContext";
import { Calculator, Check, Plus, Trash2, PieChart, Sparkles, Send } from "lucide-react";

interface CampaignCalculatorProps {
  items: AdItem[];
  onOpenDetail: (item: AdItem) => void;
}

export const CampaignCalculator: React.FC<CampaignCalculatorProps> = ({ items, onOpenDetail }) => {
  const { user, setShowAuthModal } = useAuth();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState(14);

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedItems = items.filter((item) => selectedItemIds.includes(item.id));
  const totalDailyPrice = selectedItems.reduce((acc, curr) => acc + curr.dailyPrice, 0);
  const totalDailyReach = selectedItems.reduce((acc, curr) => acc + curr.dailyImpressions, 0);
  const campaignTotalPrice = totalDailyPrice * durationDays;
  const campaignTotalImpressions = totalDailyReach * durationDays;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold">
          <Calculator className="w-3.5 h-3.5 text-blue-400" />
          <span>Interactive Campaign Reach Estimator</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold">Build Your Custom Media Mix</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Select advertising positions to project combined audience reach, daily impression totals, and package campaign costs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Item Selection List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Select Ad Positions ({selectedItemIds.length} Selected)</span>
            {selectedItemIds.length > 0 && (
              <button
                onClick={() => setSelectedItemIds([])}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Selection
              </button>
            )}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => {
              const isSelected = selectedItemIds.includes(item.id);
              const isOut = item.stock === 0;

              return (
                <div
                  key={item.id}
                  onClick={() => !isOut && toggleItem(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-500 shadow-md ring-2 ring-blue-500/20"
                      : isOut
                      ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        {item.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                      <p className="text-xs text-slate-500">{item.city} &bull; {item.stock} left in DB</p>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected ? "bg-blue-600 text-white" : "border-2 border-slate-300 text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-semibold">
                    <span className="text-slate-500">{(item.dailyImpressions / 1000).toFixed(0)}k reach/day</span>
                    <span className="text-slate-900 font-extrabold">${item.dailyPrice}/day</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Campaign Analytics Summary Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg space-y-6 sticky top-20">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PieChart className="w-5 h-5 text-blue-600" />
              <span>Projected Reach & Investment</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Length (Days)
              </label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs rounded-xl outline-none"
              >
                <option value={7}>7 Days (1 Week)</option>
                <option value={14}>14 Days (2 Weeks)</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={60}>60 Days (2 Months)</option>
              </select>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Selected Ad Locations:</span>
                <span className="font-bold text-slate-900">{selectedItems.length} Spaces</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Combined Daily Impressions:</span>
                <span className="font-bold text-blue-600">{totalDailyReach.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Total Campaign Impressions:</span>
                <span className="font-bold text-indigo-600">{campaignTotalImpressions.toLocaleString()}</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900 text-sm">Total Campaign Cost:</span>
                <span className="text-2xl font-extrabold text-slate-900">${campaignTotalPrice.toLocaleString()}</span>
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Select at least one position to estimate total reach.</p>
            ) : (
              <button
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else {
                    onOpenDetail(selectedItems[0]);
                  }
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Book Selected Package</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
