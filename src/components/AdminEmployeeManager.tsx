import React, { useState, useEffect } from "react";
import { EmployeeAccount } from "../types";
import { OFFICIAL_BRANCHES, COMPANY_ROLES, MANAGER_ROLES_CATALOG } from "../data/branches";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  KeyRound,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Copy,
  Check,
  UserX,
  ExternalLink,
  ShieldAlert,
  Send,
  Eye,
  EyeOff
} from "lucide-react";

interface AdminEmployeeManagerProps {
  onSwitchToRecovery?: (employeeEmail?: string) => void;
}

export const AdminEmployeeManager: React.FC<AdminEmployeeManagerProps> = ({ onSwitchToRecovery }) => {
  const [employees, setEmployees] = useState<EmployeeAccount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeAccount | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    branchName: "GELV INC Advertising",
    branchCode: "GELV-01",
    role: "Graphic Artist",
    department: "Advertising & Production",
    phone: "",
    status: "Active" as 'Active' | 'Locked' | 'Suspended' | 'Pending Verification',
    recoveryNote: "",
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Fetch employees
  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setEmployees(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load employees:", err);
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Show Toast
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setFeedbackToast({ message, type });
    setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
  };

  // Branch Selection helper
  const handleBranchChange = (branchName: string) => {
    const branch = OFFICIAL_BRANCHES.find(b => b.name === branchName);
    setFormData(prev => ({
      ...prev,
      branchName,
      branchCode: branch ? branch.code : "GELV-01"
    }));
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      email: "",
      branchName: OFFICIAL_BRANCHES[0].name,
      branchCode: OFFICIAL_BRANCHES[0].code,
      role: OFFICIAL_BRANCHES[0].managerRole || "Operations Manager",
      department: "Production & Signage",
      phone: "",
      status: "Active",
      recoveryNote: "Provisioned by HQ Administrator",
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: EmployeeAccount) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      email: emp.email,
      branchName: emp.branchName,
      branchCode: emp.branchCode,
      role: emp.role,
      department: emp.department || "Operations",
      phone: emp.phone || "",
      status: emp.status,
      recoveryNote: emp.recoveryNote || "",
    });
    setFormError(null);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError("Full Name and Corporate / Operational Email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingEmployee) {
        // Edit API
        const res = await fetch(`/api/admin/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to update employee");

        showToast(`Employee ${formData.name} updated successfully!`);
        setEditingEmployee(null);
      } else {
        // Create API
        const res = await fetch("/api/admin/employees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "Failed to create employee");

        showToast(`Employee ${formData.name} successfully provisioned!`);
        setShowCreateModal(false);
      }

      await fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle quick Lock / Unlock
  const handleToggleStatus = async (emp: EmployeeAccount) => {
    const nextStatus = emp.status === "Active" ? "Locked" : "Active";
    try {
      const res = await fetch(`/api/admin/employees/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to change status");

      showToast(`Employee status updated to ${nextStatus}.`);
      await fetchEmployees();
    } catch (err: any) {
      showToast(err.message || "Failed to update status", "error");
    }
  };

  // Delete Confirm
  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/employees/${deletingEmployee.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to delete employee");

      showToast(`Employee record for ${deletingEmployee.name} deleted.`);
      setDeletingEmployee(null);
      await fetchEmployees();
    } catch (err: any) {
      showToast(err.message || "Failed to delete employee", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = !searchQuery || 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));
    
    const matchesBranch = branchFilter === "All" || emp.branchName === branchFilter || emp.branchCode === branchFilter;
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* SECTION HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>GELV INC Personnel Management</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Maintain & Edit Employee Accounts
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
              Directory and role administration across all 5 official branches (Sucat Door 11, Door 0, BF Homes, Victor Medina, and Taytay Rizal).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchEmployees}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center space-x-2"
              title="Refresh Personnel Directory"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
              <span>Sync Directory</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Provision New Employee</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Staff</span>
            <span className="text-xl font-black text-white mt-1 block">{employees.length}</span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider">Active Credentials</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">
              {employees.filter(e => e.status === "Active").length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-amber-400 block uppercase tracking-wider">Locked / Restricted</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">
              {employees.filter(e => e.status === "Locked" || e.status === "Suspended").length}
            </span>
          </div>
          <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/60">
            <span className="text-[11px] font-bold text-blue-400 block uppercase tracking-wider">Official Branches</span>
            <span className="text-xl font-black text-blue-400 mt-1 block">{OFFICIAL_BRANCHES.length}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search employee by name, email, role, phone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Branches ({employees.length})</option>
              {OFFICIAL_BRANCHES.map(b => (
                <option key={b.code} value={b.name} className="bg-slate-900">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs font-semibold cursor-pointer"
            >
              <option value="All" className="bg-slate-900">All Statuses</option>
              <option value="Active" className="bg-slate-900">Active Only</option>
              <option value="Locked" className="bg-slate-900">Locked Only</option>
              <option value="Suspended" className="bg-slate-900">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* EMPLOYEES TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Employee & Contact</th>
                <th className="py-3.5 px-4">Assigned Branch & Code</th>
                <th className="py-3.5 px-4">Position / Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Auth Method</th>
                <th className="py-3.5 px-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="font-bold">No employee profiles matched your filter criteria.</p>
                    <button
                      onClick={() => { setSearchQuery(""); setBranchFilter("All"); setStatusFilter("All"); }}
                      className="mt-2 text-blue-400 hover:underline text-xs font-semibold"
                    >
                      Clear filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const branchMeta = OFFICIAL_BRANCHES.find(b => b.name === emp.branchName);
                  return (
                    <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 font-black text-white text-xs">
                            {emp.picture ? (
                              <img src={emp.picture} alt={emp.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              emp.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-white flex items-center space-x-1.5">
                              <span>{emp.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded">
                                {emp.id}
                              </span>
                            </div>
                            <div className="text-slate-400 flex items-center space-x-2 mt-0.5 text-[11px]">
                              <span className="flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{emp.email}</span>
                              </span>
                              {emp.phone && (
                                <span className="flex items-center space-x-1 text-slate-500">
                                  <span>•</span>
                                  <span>{emp.phone}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{emp.branchName}</div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: branchMeta?.badgeColor || "#3b82f6" }}
                          />
                          <span className="text-[11px] font-mono text-slate-400 font-bold">
                            {emp.branchCode || branchMeta?.code || "HQ"}
                          </span>
                        </div>
                      </td>

                      {/* Role & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-blue-300">{emp.role}</div>
                        <div className="text-[11px] text-slate-500">{emp.department || "Operations"}</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                            emp.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : emp.status === "Locked"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {emp.status === "Active" ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          <span>{emp.status}</span>
                        </span>
                      </td>

                      {/* Auth Provider */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800/80">
                          {emp.authProvider === "google" ? "Google OAuth" : "Corporate Passkey"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Quick Lock/Unlock */}
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            title={emp.status === "Active" ? "Lock Account Access" : "Unlock Account Access"}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              emp.status === "Active"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            }`}
                          >
                            {emp.status === "Active" ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Reset & Recovery Direct Link */}
                          {onSwitchToRecovery && (
                            <button
                              onClick={() => onSwitchToRecovery(emp.email)}
                              title="Go to Reset & Recovery Portal for this account"
                              className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(emp)}
                            title="Edit Employee Information"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => setDeletingEmployee(emp)}
                            title="Delete Employee Record"
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* CREATE / EDIT MODAL */}
      {(showCreateModal || editingEmployee) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  {editingEmployee ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {editingEmployee ? `Edit Employee: ${editingEmployee.name}` : "Provision New Employee Account"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingEmployee ? "Update role assignment, contact info and branch" : "Create official credentials and branch clearance"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingEmployee(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Marco Reyes"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Corporate / Branch Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. marco.gps@gelvinc.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Assigned Official Branch</label>
                  <select
                    value={formData.branchName}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {OFFICIAL_BRANCHES.map(b => (
                      <option key={b.code} value={b.name} className="bg-slate-900">
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Branch Position / Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {MANAGER_ROLES_CATALOG.map(r => (
                      <option key={r} value={r} className="bg-slate-900">{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Department / Division</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Large Format Substrates"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+63 917 XXX XXXX"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Active" className="bg-slate-900">Active (Full Access)</option>
                    <option value="Locked" className="bg-slate-900">Locked (Suspended login)</option>
                    <option value="Pending Verification" className="bg-slate-900">Pending Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Admin Reference Note</label>
                  <input
                    type="text"
                    value={formData.recoveryNote}
                    onChange={(e) => setFormData({ ...formData, recoveryNote: e.target.value })}
                    placeholder="e.g. Door 0 printing operator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingEmployee(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold shadow-lg shadow-blue-600/20 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving to Database..." : editingEmployee ? "Update Employee Profile" : "Save & Provision Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Delete Employee Account?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Are you sure you want to remove <span className="text-white font-bold">{deletingEmployee.name}</span> ({deletingEmployee.email}) from <span className="text-white font-bold">{deletingEmployee.branchName}</span>? This will revoke their branch portal access.
            </p>

            <div className="flex items-center justify-center space-x-3 mt-6">
              <button
                onClick={() => setDeletingEmployee(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-600/20 transition-all"
              >
                {isSubmitting ? "Removing..." : "Yes, Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${feedbackToast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs font-semibold text-slate-200">
            {feedbackToast.message}
          </div>
        </div>
      )}
    </div>
  );
};
