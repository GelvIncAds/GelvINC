import React, { useState, useEffect } from "react";
import { Inquiry } from "../types";
import { useAuth } from "../context/AuthContext";
import { generateRequestPDF } from "../utils/pdfGenerator";
import { BookmarkCheck, ShieldCheck, Calendar, Clock, RefreshCw, LogIn, Download, FileText } from "lucide-react";

export const UserReservations: React.FC = () => {
  const { user, setShowAuthModal } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserInquiries();
    }
  }, [user]);

  const fetchUserInquiries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inquiries");
      const json = await res.json();
      if (json.success) {
        // Filter by user's email if logged in
        if (user) {
          const filtered = json.data.filter((i: Inquiry) => i.userEmail.toLowerCase() === user.email.toLowerCase());
          setInquiries(filtered);
        } else {
          setInquiries(json.data);
        }
      }
    } catch (e) {
      console.error("Error loading user inquiries", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4 max-w-md mx-auto my-12 shadow-md">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <LogIn className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Google Account Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sign in with your Google Account to view active advertising slot holds, reservation history, and rate cards.
        </p>
        <button
          onClick={() => setShowAuthModal(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-flex items-center space-x-2"
        >
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Verified Google Reservations</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold">My Active Media Holds</h1>
          <p className="text-xs text-slate-300">
            Account: <strong>{user.name}</strong> ({user.email})
          </p>
        </div>

        <button
          onClick={fetchUserInquiries}
          className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors self-start sm:self-auto"
          title="Refresh Reservations"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading your holds from database...</div>
        ) : inquiries.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No active stock holds found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't reserved any advertising positions under <strong className="text-slate-700">{user.email}</strong> yet. Browse the inventory catalog to reserve slots.
            </p>
          </div>
        ) : (
          inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-base">{inq.itemTitle}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md text-[10px]">
                    {inq.status}
                  </span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[10px] flex items-center space-x-1">
                    <FileText className="w-3 h-3" />
                    <span>PDF Sent to Admins</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-slate-600 font-medium">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Start: {inq.startDate} ({inq.durationDays} Days)</span>
                  </span>

                  <span className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reserved: {new Date(inq.createdAt).toLocaleDateString()}</span>
                  </span>

                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-bold">
                    {inq.requestedUnits} Unit(s)
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-between gap-2 sm:border-l sm:pl-6 border-slate-200">
                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total Investment</span>
                  <span className="text-xl font-extrabold text-slate-900">${inq.totalAmount.toLocaleString()}</span>
                </div>

                <button
                  onClick={() => {
                    const pdfRes = generateRequestPDF(inq);
                    pdfRes.doc.save(pdfRes.filename);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Form</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
