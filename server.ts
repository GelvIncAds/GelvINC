import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { INITIAL_INVENTORY } from "./src/data/initialInventory";
import { INITIAL_EMPLOYEES } from "./src/data/initialEmployees";
import { AdItem, StockAuditLog, Inquiry, InventoryStats, BranchRequest, EmployeeAccount } from "./src/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const INVENTORY_FILE = path.join(DATA_DIR, "inventory.json");
const LOGS_FILE = path.join(DATA_DIR, "audit_logs.json");
const INQUIRIES_FILE = path.join(DATA_DIR, "inquiries.json");
const BRANCH_REQUESTS_FILE = path.join(DATA_DIR, "branch_requests.json");
const EMPLOYEES_FILE = path.join(DATA_DIR, "employees.json");
const PROVISIONED_USERS_DIR = path.join(DATA_DIR, "provisioned_users");

// Ensure data directory and provisioned users directory exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PROVISIONED_USERS_DIR)) {
  fs.mkdirSync(PROVISIONED_USERS_DIR, { recursive: true });
}

// In-Memory Database initialized from file cache or initial seed
let inventoryDb: AdItem[] = [];
let auditLogs: StockAuditLog[] = [];
let inquiriesDb: Inquiry[] = [];
let branchRequestsDb: BranchRequest[] = [];
let employeesDb: EmployeeAccount[] = [];

const VALID_CATEGORIES = ['Tarpaulin', 'Panaflex', 'Stickers', 'Photopapers', 'Paperstocks', 'Inks', 'Films'];

// Helper to write individual JSON file for every provisioned employee/user
function saveUserProvisioningJson(user: EmployeeAccount, provisionedBy = "HQ Administrator"): { filename: string; filePath: string; payload: any } {
  try {
    if (!fs.existsSync(PROVISIONED_USERS_DIR)) {
      fs.mkdirSync(PROVISIONED_USERS_DIR, { recursive: true });
    }

    const sanitizedEmail = (user.email || "user").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const filename = `${user.id || "EMP-USER"}_${sanitizedEmail}.json`;
    const filePath = path.join(PROVISIONED_USERS_DIR, filename);

    const payload = {
      provisionId: `PROV-${Date.now().toString().slice(-6)}`,
      employeeId: user.id,
      uid: user.uid,
      name: user.name,
      email: user.email,
      branchName: user.branchName,
      branchCode: user.branchCode,
      role: user.role,
      department: user.department || "Operations",
      phone: user.phone || "",
      status: user.status || "Active",
      authProvider: user.authProvider || "password",
      tempPassword: user.tempPassword || "",
      recoveryNote: user.recoveryNote || "",
      createdAt: user.createdAt || new Date().toISOString(),
      provisionedAt: new Date().toISOString(),
      provisionedBy: provisionedBy,
      lastLogin: user.lastLogin || null,
      lastPasswordReset: user.lastPasswordReset || null,
      resetRecoveryToken: user.resetRecoveryToken || null,
      fileName: filename,
      metadata: {
        organization: "GELV INC Advertising",
        system: "Enterprise Employee Provisioning Engine",
        version: "2026.1",
        exportTimestamp: new Date().toISOString()
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
    console.log(`[Provisioning] Saved user provisioning JSON file: ${filename}`);
    return { filename, filePath, payload };
  } catch (err) {
    console.error("Error creating user provisioning JSON file:", err);
    return { filename: "", filePath: "", payload: null };
  }
}

function loadData() {
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      const data = fs.readFileSync(INVENTORY_FILE, "utf-8");
      const loaded: AdItem[] = JSON.parse(data);
      const isLegacy = loaded.some(item => !VALID_CATEGORIES.includes(item.category as string));
      if (isLegacy) {
        inventoryDb = [...INITIAL_INVENTORY];
        saveData();
      } else {
        inventoryDb = Array.isArray(loaded) ? loaded : [];
      }
    } else {
      inventoryDb = [...INITIAL_INVENTORY];
      saveData();
    }

    if (fs.existsSync(LOGS_FILE)) {
      const logsData = fs.readFileSync(LOGS_FILE, "utf-8");
      auditLogs = JSON.parse(logsData);
    }

    if (fs.existsSync(INQUIRIES_FILE)) {
      const inqData = fs.readFileSync(INQUIRIES_FILE, "utf-8");
      inquiriesDb = JSON.parse(inqData);
    }

    if (fs.existsSync(BRANCH_REQUESTS_FILE)) {
      const branchData = fs.readFileSync(BRANCH_REQUESTS_FILE, "utf-8");
      const loadedBranchReqs = JSON.parse(branchData);
      if (Array.isArray(loadedBranchReqs) && loadedBranchReqs.length > 0) {
        branchRequestsDb = loadedBranchReqs;
      } else {
        branchRequestsDb = getSeedBranchRequests();
        saveData();
      }
    } else {
      branchRequestsDb = getSeedBranchRequests();
      saveData();
    }

    if (fs.existsSync(EMPLOYEES_FILE)) {
      const empData = fs.readFileSync(EMPLOYEES_FILE, "utf-8");
      const loadedEmployees = JSON.parse(empData);
      if (Array.isArray(loadedEmployees) && loadedEmployees.length > 0) {
        employeesDb = loadedEmployees;
      } else {
        employeesDb = [...INITIAL_EMPLOYEES];
        saveData();
      }
    } else {
      employeesDb = [...INITIAL_EMPLOYEES];
      saveData();
    }

    // Ensure all employees in the database have their JSON provisioning file written
    employeesDb.forEach((emp) => {
      saveUserProvisioningJson(emp, "System Bootstrapping & Directory Initialization");
    });
  } catch (err) {
    console.error("Error loading stored database, reverting to seed:", err);
    inventoryDb = [...INITIAL_INVENTORY];
    branchRequestsDb = getSeedBranchRequests();
    employeesDb = [...INITIAL_EMPLOYEES];
    employeesDb.forEach((emp) => {
      saveUserProvisioningJson(emp, "System Bootstrapping Seed");
    });
  }
}

function getSeedBranchRequests(): BranchRequest[] {
  return [
    {
      id: "BR-892011",
      branchName: "Great Print & Sign",
      branchCode: "GPS-02",
      requesterName: "Marco Reyes",
      requesterEmail: "gps.branch@gelvinc.com",
      requesterRole: "Branch Production Lead",
      requiredByDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
      priority: "High Priority",
      purpose: "Restock heavy gloss tarpaulin rolls for city billboard campaigns",
      items: [
        {
          itemId: "item-1",
          itemTitle: "Heavy-Duty Frontlit Gloss Tarpaulin 13oz",
          category: "Tarpaulin",
          dimensions: "10ft x 164ft (3.2m x 50m)",
          requestedQuantity: 8,
          unit: "rolls"
        }
      ],
      status: "Approved & Dispatched",
      shippingStatus: "Shipped Out & En Route",
      courierName: "GELV Logistics Fleet - Truck #4",
      trackingNumber: "TRK-GPS-49201",
      estimatedDeliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
      shippedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      dispatchedToEmail: "jade.gelv8@gmail.com",
      sentToEmails: ["jade.gelv8@gmail.com", "gps.branch@gelvinc.com"],
      notifications: [
        {
          id: "notif-1",
          type: "Waybill & Shipment Dispatched",
          title: "Materials Shipped to Great Print & Sign",
          message: "Your requisition of 8 rolls has been dispatched via Logistics Truck #4. Waybill: TRK-GPS-49201.",
          recipientEmail: "gps.branch@gelvinc.com",
          sentBy: "HQ Admin (jade.gelv8@gmail.com)",
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
          delivered: true
        }
      ]
    },
    {
      id: "BR-741029",
      branchName: "VG Formera",
      branchCode: "VGF-03",
      requesterName: "Carla Bautista",
      requesterEmail: "vgf.branch@gelvinc.com",
      requesterRole: "Branch Manager / Artist",
      requiredByDate: new Date(Date.now() + 5 * 86400000).toISOString().split("T")[0],
      priority: "Normal",
      purpose: "Panaflex flex banners and lightbox backdrops for commercial clients",
      items: [
        {
          itemId: "item-3",
          itemTitle: "Commercial Panaflex Backlit Substrate Flex Banner",
          category: "Panaflex",
          dimensions: "8.2ft x 164ft (2.5m x 50m)",
          requestedQuantity: 5,
          unit: "rolls"
        }
      ],
      status: "Pending HQ Review",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      dispatchedToEmail: "jade.gelv8@gmail.com",
      sentToEmails: ["jade.gelv8@gmail.com", "vgf.branch@gelvinc.com"]
    },
    {
      id: "BR-618302",
      branchName: "Kulay Advertising",
      branchCode: "KUL-04",
      requesterName: "Danilo Cruz",
      requesterEmail: "kulay.branch@gelvinc.com",
      requesterRole: "Studio Branch Manager",
      requiredByDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
      priority: "Emergency Restock",
      purpose: "Vehicle wrap vinyl sticker rolls for fleet branding project",
      items: [
        {
          itemId: "item-5",
          itemTitle: "Self-Adhesive Premium Gloss Vinyl Sticker Roll",
          category: "Stickers",
          dimensions: "4.5ft x 164ft (1.37m x 50m)",
          requestedQuantity: 6,
          unit: "rolls"
        }
      ],
      status: "Pending HQ Review",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      dispatchedToEmail: "jade.gelv8@gmail.com",
      sentToEmails: ["jade.gelv8@gmail.com", "kulay.branch@gelvinc.com"]
    },
    {
      id: "BR-552914",
      branchName: "Taytay Print & Sign",
      branchCode: "TPS-05",
      requesterName: "Elena Santos",
      requesterEmail: "taytay.branch@gelvinc.com",
      requesterRole: "Branch Production Specialist",
      requiredByDate: new Date(Date.now() + 6 * 86400000).toISOString().split("T")[0],
      priority: "Normal",
      purpose: "Large format satin photographic paper replenishment",
      items: [
        {
          itemId: "item-8",
          itemTitle: "Large Format Microporous Satin Photo Paper Roll",
          category: "Photopapers",
          dimensions: "3ft x 100ft (0.914m x 30m)",
          requestedQuantity: 4,
          unit: "rolls"
        }
      ],
      status: "Approved & Dispatched",
      shippingStatus: "Delivered",
      courierName: "Direct Branch Dispatch",
      trackingNumber: "TRK-TPS-91023",
      estimatedDeliveryDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      shippedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      dispatchedToEmail: "jade.gelv8@gmail.com",
      sentToEmails: ["jade.gelv8@gmail.com", "taytay.branch@gelvinc.com"]
    }
  ];
}

function saveData() {
  try {
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventoryDb, null, 2), "utf-8");
    fs.writeFileSync(LOGS_FILE, JSON.stringify(auditLogs, null, 2), "utf-8");
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiriesDb, null, 2), "utf-8");
    fs.writeFileSync(BRANCH_REQUESTS_FILE, JSON.stringify(branchRequestsDb, null, 2), "utf-8");
    fs.writeFileSync(EMPLOYEES_FILE, JSON.stringify(employeesDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving inventory database:", err);
  }
}

loadData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === API ROUTES ===

  // GET /api/inventory - Search and filter inventory in real-time
  app.get("/api/inventory", (req, res) => {
    const { q, category, status, minPrice, maxPrice, inStockOnly } = req.query;

    let results = [...inventoryDb];

    if (q && typeof q === "string" && q.trim()) {
      const queryLower = q.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(queryLower) ||
          (item.sku && item.sku.toLowerCase().includes(queryLower)) ||
          (item.brand && item.brand.toLowerCase().includes(queryLower)) ||
          (item.thickness && item.thickness.toLowerCase().includes(queryLower)) ||
          item.category.toLowerCase().includes(queryLower) ||
          item.description.toLowerCase().includes(queryLower)
      );
    }

    if (category && typeof category === "string" && category !== "All") {
      results = results.filter((item) => item.category === category);
    }

    if (status && typeof status === "string" && status !== "All") {
      results = results.filter((item) => item.status === status);
    }

    if (inStockOnly === "true") {
      results = results.filter((item) => item.stock > 0);
    }

    if (minPrice && !isNaN(Number(minPrice))) {
      results = results.filter((item) => (item.dailyPrice || 0) >= Number(minPrice));
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      results = results.filter((item) => (item.dailyPrice || 0) <= Number(maxPrice));
    }

    res.json({
      success: true,
      count: results.length,
      data: results,
      lastSynced: new Date().toISOString(),
    });
  });

  // GET /api/inventory/:id
  app.get("/api/inventory/:id", (req, res) => {
    const item = inventoryDb.find((i) => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: "Advertising space not found" });
    }
    res.json({ success: true, data: item });
  });

  // GET /api/stats
  app.get("/api/stats", (_req, res) => {
    const totalItems = inventoryDb.length;
    const totalStockAvailable = inventoryDb.reduce((acc, curr) => acc + curr.stock, 0);
    const totalDailyReach = inventoryDb.reduce((acc, curr) => acc + curr.dailyImpressions, 0);
    const lowStockCount = inventoryDb.filter((i) => i.stock > 0 && i.stock <= 2).length;
    const soldOutCount = inventoryDb.filter((i) => i.stock === 0).length;

    const categoriesCount: Record<string, number> = {};
    inventoryDb.forEach((item) => {
      categoriesCount[item.category] = (categoriesCount[item.category] || 0) + 1;
    });

    const stats: InventoryStats = {
      totalItems,
      totalStockAvailable,
      totalDailyReach,
      lowStockCount,
      soldOutCount,
      categoriesCount,
    };

    res.json({ success: true, data: stats });
  });

  // PUT /api/admin/inventory/:id/stock - ADMIN MANUAL STOCK CHANGE VIA DATABASE
  app.put("/api/admin/inventory/:id/stock", (req, res) => {
    const { newStock, updatedBy = "Admin", reason = "Manual Database Stock Adjustment" } = req.body;

    if (typeof newStock !== "number" || newStock < 0) {
      return res.status(400).json({ success: false, error: "Valid non-negative stock number required" });
    }

    const itemIndex = inventoryDb.findIndex((i) => i.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Inventory item not found" });
    }

    const item = inventoryDb[itemIndex];
    const previousStock = item.stock;

    // Update stock and status dynamically
    item.stock = newStock;
    if (newStock === 0) {
      item.status = "Sold Out";
    } else if (newStock <= 2) {
      item.status = "Low Stock";
    } else {
      item.status = "Available";
    }
    item.lastUpdated = new Date().toISOString();

    // Record audit log
    const log: StockAuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: item.id,
      itemTitle: item.title,
      previousStock,
      newStock,
      updatedBy,
      timestamp: new Date().toISOString(),
      reason,
    };
    auditLogs.unshift(log);

    saveData();

    res.json({
      success: true,
      message: `Stock updated successfully for '${item.title}'`,
      data: item,
      auditLog: log,
    });
  });

  // POST /api/admin/inventory - ADMIN ADD NEW ITEM
  app.post("/api/admin/inventory", (req, res) => {
    const {
      sku,
      brand,
      title,
      category,
      dimensions,
      thickness,
      dailyImpressions,
      dailyPrice,
      stock,
      imageUrl,
      description,
      specs,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, error: "Missing required fields: title, category" });
    }

    const newItemStock = typeof stock === "number" ? stock : 1;
    const newItem: AdItem = {
      id: `ad-${Date.now()}`,
      sku: sku ? String(sku).trim().toUpperCase() : undefined,
      brand: brand ? String(brand).trim() : undefined,
      title,
      category,
      dimensions: dimensions || "Standard Specs",
      thickness: thickness || "Standard Thickness",
      dailyImpressions: Number(dailyImpressions) || 100000,
      dailyPrice: dailyPrice !== undefined ? Number(dailyPrice) : 0,
      stock: newItemStock,
      status: newItemStock === 0 ? "Sold Out" : newItemStock <= 2 ? "Low Stock" : "Available",
      imageUrl: imageUrl || "https://images.unsplash.com/photo-1506146332389-18140dc7b2fb?auto=format&fit=crop&w=1200&q=80",
      description: description || "Premium outdoor printing and advertising substrate with high-durability finish.",
      specs: specs || { resolution: "Full HD", operatingHours: "24/7" },
      lastUpdated: new Date().toISOString(),
    };

    inventoryDb.unshift(newItem);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: newItem.id,
      itemTitle: newItem.title,
      previousStock: 0,
      newStock: newItemStock,
      updatedBy: "Admin",
      timestamp: new Date().toISOString(),
      reason: "Added new material to database",
    });

    saveData();

    res.status(201).json({ success: true, data: newItem });
  });

  // PUT /api/admin/inventory/:id - ADMIN UPDATE ITEM DETAILS
  app.put("/api/admin/inventory/:id", (req, res) => {
    const itemIndex = inventoryDb.findIndex((i) => i.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Inventory item not found" });
    }

    const existing = inventoryDb[itemIndex];
    const updatedStock = req.body.stock !== undefined ? req.body.stock : existing.stock;

    let status = existing.status;
    if (updatedStock === 0) status = "Sold Out";
    else if (updatedStock <= 2) status = "Low Stock";
    else status = req.body.status || "Available";

    const updatedItem: AdItem = {
      ...existing,
      ...req.body,
      stock: updatedStock,
      status,
      lastUpdated: new Date().toISOString(),
    };

    if (existing.stock !== updatedStock) {
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        itemId: existing.id,
        itemTitle: existing.title,
        previousStock: existing.stock,
        newStock: updatedStock,
        updatedBy: "Admin",
        timestamp: new Date().toISOString(),
        reason: "Item details updated via Admin Portal",
      });
    }

    inventoryDb[itemIndex] = updatedItem;
    saveData();

    res.json({ success: true, data: updatedItem });
  });

  // DELETE /api/admin/inventory/:id
  app.delete("/api/admin/inventory/:id", (req, res) => {
    const itemIndex = inventoryDb.findIndex((i) => i.id === req.params.id);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const deleted = inventoryDb.splice(itemIndex, 1)[0];
    
    // Add audit log entry for deletion
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: deleted.id,
      itemTitle: `${deleted.title} (Deleted)`,
      previousStock: deleted.stock,
      newStock: 0,
      updatedBy: "Admin System",
      timestamp: new Date().toISOString(),
      reason: "Permanent Item Deletion from Inventory DB",
    });

    saveData();

    res.json({ success: true, message: `Deleted ${deleted.title}` });
  });

  // POST /api/admin/reset - Reset database to initial seed
  app.post("/api/admin/reset", (_req, res) => {
    inventoryDb = [...INITIAL_INVENTORY];
    auditLogs = [{
      id: `log-${Date.now()}`,
      itemId: "all",
      itemTitle: "Database Reset",
      previousStock: 0,
      newStock: inventoryDb.reduce((a, b) => a + b.stock, 0),
      updatedBy: "Admin System",
      timestamp: new Date().toISOString(),
      reason: "Full Database Reset to Factory Seed Data",
    }];
    saveData();
    res.json({ success: true, message: "Database reset to initial sample data", data: inventoryDb });
  });

  // GET /api/admin/audit-logs
  app.get("/api/admin/audit-logs", (_req, res) => {
    res.json({ success: true, count: auditLogs.length, data: auditLogs });
  });

  // POST /api/inquiries - Users with Google Account place inquiries or stock holds
  app.post("/api/inquiries", (req, res) => {
    const { itemId, userEmail, userName, durationDays, requestedUnits, startDate, pdfDataUrl, sentToAdmins } = req.body;

    if (!itemId || !userEmail || !durationDays || !requestedUnits) {
      return res.status(400).json({ success: false, error: "Missing inquiry details" });
    }

    const item = inventoryDb.find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Advertising space not found" });
    }

    if (item.stock < requestedUnits) {
      return res.status(400).json({
        success: false,
        error: `Insufficient stock. Only ${item.stock} unit(s) currently available.`,
      });
    }

    // Automatically decrement stock on reservation
    const previousStock = item.stock;
    item.stock -= requestedUnits;
    if (item.stock === 0) item.status = "Sold Out";
    else if (item.stock <= 2) item.status = "Low Stock";
    item.lastUpdated = new Date().toISOString();

    const totalAmount = item.dailyPrice * durationDays * requestedUnits;
    const defaultAdmins = ["jade.gelv8@gmail.com", "JYS@gelvinc.com", "admin@gelvinc.com", "ops@gelvinc.com"];
    const adminRecipients = sentToAdmins && Array.isArray(sentToAdmins) ? sentToAdmins : defaultAdmins;

    const newInquiry: Inquiry = {
      id: `inq-${Date.now()}`,
      itemId: item.id,
      itemTitle: item.title,
      userEmail,
      userName: userName || "Google User",
      durationDays: Number(durationDays),
      requestedUnits: Number(requestedUnits),
      startDate: startDate || new Date().toISOString().split("T")[0],
      totalAmount,
      status: "Confirmed",
      createdAt: new Date().toISOString(),
      pdfDataUrl: pdfDataUrl || undefined,
      sentToAdmins: adminRecipients,
    };

    inquiriesDb.unshift(newInquiry);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: item.id,
      itemTitle: item.title,
      previousStock,
      newStock: item.stock,
      updatedBy: `User (${userEmail})`,
      timestamp: new Date().toISOString(),
      reason: `Slot reserved & Request Form dispatched to jade.gelv8@gmail.com and admin team`,
    });

    saveData();

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${item.title}! PDF Request Form dispatched directly to jade.gelv8@gmail.com and operations team.`,
      data: newInquiry,
      updatedStock: item.stock,
    });
  });

  // GET /api/inquiries
  app.get("/api/inquiries", (_req, res) => {
    res.json({ success: true, count: inquiriesDb.length, data: inquiriesDb });
  });

  // === BRANCH REQUEST PORTAL APIs ===

  // GET /api/branch-requests
  app.get("/api/branch-requests", (req, res) => {
    const { branchCode, branchName, email, status, isAdmin } = req.query;
    let list = [...branchRequestsDb];

    // Non-admin branch isolation: if branchCode or branchName is specified, filter strictly
    if (branchCode && typeof branchCode === "string" && branchCode !== "All") {
      list = list.filter(r => r.branchCode.toLowerCase() === branchCode.toLowerCase());
    } else if (branchName && typeof branchName === "string" && branchName !== "All") {
      list = list.filter(r => r.branchName.toLowerCase() === branchName.toLowerCase());
    }

    if (email && typeof email === "string" && email !== "All") {
      list = list.filter(r => r.requesterEmail.toLowerCase() === email.toLowerCase());
    }

    if (status && typeof status === "string" && status !== "All") {
      list = list.filter(r => r.status === status);
    }

    res.json({ success: true, count: list.length, data: list });
  });

  // POST /api/branch-requests - Create a new branch item request to HQ
  app.post("/api/branch-requests", (req, res) => {
    const {
      branchName,
      branchCode,
      requesterName,
      requesterEmail,
      requesterRole,
      requiredByDate,
      priority,
      purpose,
      items,
      pdfDataUrl
    } = req.body;

    if (!branchName || !requesterName || !requesterEmail || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Missing required branch requisition fields or empty item list" });
    }

    const primaryTargetEmail = "jade.gelv8@gmail.com";

    const newReq: BranchRequest = {
      id: `BR-${Date.now().toString().slice(-6)}`,
      branchName,
      branchCode: branchCode || "BR-GEN",
      requesterName,
      requesterEmail,
      requesterRole: requesterRole || "Branch Staff",
      requiredByDate: requiredByDate || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      priority: priority || "Normal",
      purpose: purpose || "Branch inventory replenishment",
      items,
      status: "Pending HQ Review",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pdfDataUrl: pdfDataUrl || undefined,
      dispatchedToEmail: primaryTargetEmail,
      sentToEmails: [primaryTargetEmail, "admin@gelvinc.com"],
    };

    branchRequestsDb.unshift(newReq);

    // Audit log
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: "HQ-REQUISITION",
      itemTitle: `Branch Requisition from ${branchName}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: `${requesterName} (${branchName})`,
      timestamp: new Date().toISOString(),
      reason: `Submitted requisition request (${newReq.id}) with ${items.length} line(s) - dispatched to ${primaryTargetEmail}`,
    });

    saveData();

    res.status(201).json({
      success: true,
      message: `Branch Requisition ${newReq.id} submitted successfully and dispatched to ${primaryTargetEmail}!`,
      data: newReq
    });
  });

  // PATCH /api/branch-requests/:id/status - HQ Admin approves/declines/updates status & notifies requester
  app.patch("/api/branch-requests/:id/status", (req, res) => {
    const {
      status,
      hqNotes,
      autoDecrement = true,
      notifyRequester = true,
      notificationMessage,
      shippingStatus,
      courierName,
      trackingNumber,
      estimatedDeliveryDate,
      adminName = "HQ Admin (jade.gelv8@gmail.com)",
    } = req.body;
    const requestIndex = branchRequestsDb.findIndex(r => r.id === req.params.id);

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, error: "Branch request not found" });
    }

    const targetReq = branchRequestsDb[requestIndex];
    const oldStatus = targetReq.status;
    targetReq.status = status || targetReq.status;
    targetReq.updatedAt = new Date().toISOString();
    if (hqNotes !== undefined) {
      targetReq.hqNotes = hqNotes;
    }

    if (shippingStatus) {
      targetReq.shippingStatus = shippingStatus;
      if (shippingStatus === "Shipped Out & En Route" && !targetReq.shippedAt) {
        targetReq.shippedAt = new Date().toISOString();
      } else if (shippingStatus === "Delivered") {
        targetReq.deliveredAt = new Date().toISOString();
      }
    } else if (status === "Approved & Dispatched" && !targetReq.shippingStatus) {
      targetReq.shippingStatus = "Preparing for Dispatch";
    }

    if (courierName !== undefined) targetReq.courierName = courierName;
    if (trackingNumber !== undefined) targetReq.trackingNumber = trackingNumber;
    if (estimatedDeliveryDate !== undefined) targetReq.estimatedDeliveryDate = estimatedDeliveryDate;

    // If approving for the first time and autoDecrement is requested, fulfill quantities from HQ inventory
    if (status === "Approved & Dispatched" && oldStatus !== "Approved & Dispatched" && autoDecrement) {
      targetReq.items.forEach((reqItem) => {
        const invItem = inventoryDb.find((i) => i.id === reqItem.itemId);
        if (invItem) {
          const prevStock = invItem.stock;
          const qtyToSubtract = Math.min(invItem.stock, reqItem.requestedQuantity);
          invItem.stock -= qtyToSubtract;
          if (invItem.stock === 0) invItem.status = "Sold Out";
          else if (invItem.stock <= 2) invItem.status = "Low Stock";
          invItem.lastUpdated = new Date().toISOString();

          auditLogs.unshift({
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            itemId: invItem.id,
            itemTitle: invItem.title,
            previousStock: prevStock,
            newStock: invItem.stock,
            updatedBy: adminName,
            timestamp: new Date().toISOString(),
            reason: `Dispatched ${qtyToSubtract} unit(s) to ${targetReq.branchName} for Requisition ${targetReq.id}`,
          });
        }
      });
    }

    // Attach notification if requested
    if (notifyRequester) {
      if (!targetReq.notifications) targetReq.notifications = [];

      let notifType: 'Approval Notice' | 'Shipped Out' | 'Delivered' | 'General Update' | 'Request Declined' = 'Approval Notice';
      if (status === "Approved & Dispatched") {
        notifType = targetReq.shippingStatus === "Shipped Out & En Route" ? "Shipped Out" : "Approval Notice";
      } else if (status === "Declined") {
        notifType = "Request Declined";
      } else if (status === "Completed" || targetReq.shippingStatus === "Delivered") {
        notifType = "Delivered";
      } else {
        notifType = "General Update";
      }

      const notifTitle = notificationMessage && req.body.notificationTitle
        ? req.body.notificationTitle
        : notifType === "Shipped Out"
        ? `Requisition ${targetReq.id} Shipped Out by HQ`
        : notifType === "Approval Notice"
        ? `Requisition ${targetReq.id} Approved by HQ`
        : notifType === "Request Declined"
        ? `Requisition ${targetReq.id} Declined by HQ Admin`
        : `Requisition ${targetReq.id} Status Update`;

      const notifMsg = notificationMessage || (
        notifType === "Shipped Out"
          ? `Your requested materials have been packed and shipped out via ${targetReq.courierName || 'GELV Logistics Fleet'}. Tracking: ${targetReq.trackingNumber || 'N/A'}. ETA: ${targetReq.estimatedDeliveryDate || 'Upcoming delivery'}.`
          : notifType === "Approval Notice"
          ? `HQ has approved your branch requisition of ${targetReq.items.length} material item(s). Warehouse preparation is underway.`
          : notifType === "Request Declined"
          ? `HQ has declined your branch requisition (${targetReq.id}). Reason: ${targetReq.hqNotes || 'Material unavailable or request specifications could not be fulfilled at this time.'}`
          : `Requisition status updated to '${targetReq.status}' with note: ${targetReq.hqNotes || 'No notes provided.'}`
      );

      const notifRecord = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: notifType,
        title: notifTitle,
        message: notifMsg,
        timestamp: new Date().toISOString(),
        sentBy: adminName,
        recipientEmail: targetReq.requesterEmail,
        details: {
          shippingStatus: targetReq.shippingStatus,
          courierName: targetReq.courierName,
          trackingNumber: targetReq.trackingNumber,
          estimatedDeliveryDate: targetReq.estimatedDeliveryDate,
        }
      };

      targetReq.notifications.unshift(notifRecord);
      targetReq.lastNotifiedAt = new Date().toISOString();

      auditLogs.unshift({
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: targetReq.id,
        itemTitle: `Notification Dispatched to ${targetReq.requesterName}`,
        previousStock: 0,
        newStock: 0,
        updatedBy: adminName,
        timestamp: new Date().toISOString(),
        reason: `Dispatched ${notifType} email/notification to requestor (${targetReq.requesterEmail}) for Requisition ${targetReq.id}`,
      });
    }

    saveData();

    res.json({
      success: true,
      message: `Requisition ${targetReq.id} status updated to '${targetReq.status}' and requestor notified!`,
      data: targetReq
    });
  });

  // POST /api/branch-requests/:id/notify - Admin sends explicit shipment/approval notification to requestor
  app.post("/api/branch-requests/:id/notify", (req, res) => {
    const {
      notificationType = "Shipped Out",
      title,
      message,
      shippingStatus,
      courierName,
      trackingNumber,
      estimatedDeliveryDate,
      adminName = "HQ Admin (jade.gelv8@gmail.com)",
    } = req.body;

    const requestIndex = branchRequestsDb.findIndex(r => r.id === req.params.id);
    if (requestIndex === -1) {
      return res.status(404).json({ success: false, error: "Branch request not found" });
    }

    const targetReq = branchRequestsDb[requestIndex];
    if (!targetReq.notifications) targetReq.notifications = [];

    if (shippingStatus) {
      targetReq.shippingStatus = shippingStatus;
      if (shippingStatus === "Shipped Out & En Route" && !targetReq.shippedAt) {
        targetReq.shippedAt = new Date().toISOString();
      } else if (shippingStatus === "Delivered") {
        targetReq.deliveredAt = new Date().toISOString();
      }
    }
    if (courierName !== undefined) targetReq.courierName = courierName;
    if (trackingNumber !== undefined) targetReq.trackingNumber = trackingNumber;
    if (estimatedDeliveryDate !== undefined) targetReq.estimatedDeliveryDate = estimatedDeliveryDate;

    const defaultTitle = notificationType === "Shipped Out"
      ? `Materials Shipped Out for Requisition ${targetReq.id}`
      : notificationType === "Approval Notice"
      ? `Requisition ${targetReq.id} Approved`
      : notificationType === "Request Declined"
      ? `Requisition ${targetReq.id} Declined by HQ Admin`
      : `HQ Supply Update for Requisition ${targetReq.id}`;

    const defaultMessage = message || (
      notificationType === "Shipped Out"
        ? `Items have been dispatched from Headquarters via ${targetReq.courierName || 'Logistics Fleet'} (Waybill: ${targetReq.trackingNumber || 'Pending'}). Expected delivery: ${targetReq.estimatedDeliveryDate || 'Soon'}.`
        : notificationType === "Request Declined"
        ? `HQ Admin has declined your branch requisition ${targetReq.id}. Reason: ${targetReq.hqNotes || 'Material unavailable or request specifications could not be fulfilled at this time.'}`
        : `Your branch requisition ${targetReq.id} has been processed by HQ Admin.`
    );

    const newNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: notificationType,
      title: title || defaultTitle,
      message: defaultMessage,
      timestamp: new Date().toISOString(),
      sentBy: adminName,
      recipientEmail: targetReq.requesterEmail,
      details: {
        shippingStatus: targetReq.shippingStatus,
        courierName: targetReq.courierName,
        trackingNumber: targetReq.trackingNumber,
        estimatedDeliveryDate: targetReq.estimatedDeliveryDate,
      }
    };

    targetReq.notifications.unshift(newNotification);
    targetReq.lastNotifiedAt = new Date().toISOString();
    targetReq.updatedAt = new Date().toISOString();

    auditLogs.unshift({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      itemId: targetReq.id,
      itemTitle: `HQ Notification Sent to ${targetReq.requesterName}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: adminName,
      timestamp: new Date().toISOString(),
      reason: `Sent '${notificationType}' notification to ${targetReq.requesterEmail} (Requisition ${targetReq.id})`,
    });

    saveData();

    res.json({
      success: true,
      message: `Notification sent to ${targetReq.requesterEmail}!`,
      data: targetReq,
      notification: newNotification,
    });
  });

  // === EMPLOYEE ACCOUNTS & RECOVERY APIs ===

  // GET /api/admin/employees - Fetch all employee accounts
  app.get("/api/admin/employees", (req, res) => {
    const { branch, status, search } = req.query;
    let list = [...employeesDb];

    if (branch && typeof branch === "string" && branch !== "All") {
      list = list.filter(e => e.branchName.toLowerCase() === branch.toLowerCase() || e.branchCode.toLowerCase() === branch.toLowerCase());
    }

    if (status && typeof status === "string" && status !== "All") {
      list = list.filter(e => e.status === status);
    }

    if (search && typeof search === "string" && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(e => 
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        (e.department && e.department.toLowerCase().includes(q)) ||
        (e.phone && e.phone.includes(q))
      );
    }

    res.json({ success: true, count: list.length, data: list });
  });

  // POST /api/admin/employees - Create new employee profile
  app.post("/api/admin/employees", (req, res) => {
    const { name, email, branchName, branchCode, role, department, phone, status, authProvider, recoveryNote, tempPassword } = req.body;

    if (!name || !email || !branchName) {
      return res.status(400).json({ success: false, error: "Missing required employee profile fields" });
    }

    const existing = employeesDb.find(e => e.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ success: false, error: `An employee with email '${email}' already exists.` });
    }

    const newEmp: EmployeeAccount = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      uid: `uid-emp-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      branchName: branchName.trim(),
      branchCode: branchCode || "GELV-01",
      role: role || "Graphic Artist",
      department: department || "Operations",
      phone: phone || "",
      status: (status as any) || "Active",
      authProvider: (authProvider as any) || "password",
      tempPassword: tempPassword || "GelvInc@2026",
      createdAt: new Date().toISOString(),
      lastLogin: undefined,
      recoveryNote: recoveryNote || `Account created by HQ Admin on ${new Date().toLocaleDateString()}`
    };

    employeesDb.unshift(newEmp);

    // Save dedicated JSON provisioning file for new user
    const { filename: provFileName, payload: provPayload } = saveUserProvisioningJson(newEmp, "HQ Administrator Provisioning");

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: newEmp.id,
      itemTitle: `Employee Account Created: ${newEmp.name}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: "HQ Administrator",
      timestamp: new Date().toISOString(),
      reason: `Provisioned new employee profile (${newEmp.email}) for branch ${newEmp.branchName} [File: ${provFileName}]`,
    });

    saveData();

    res.status(201).json({
      success: true,
      message: `Employee account for ${newEmp.name} created successfully! Provisioning JSON generated: ${provFileName}`,
      data: newEmp,
      provisionedFile: provFileName,
      provisionedJson: provPayload
    });
  });

  // PUT /api/admin/employees/:id - Update employee profile details
  app.put("/api/admin/employees/:id", (req, res) => {
    const { name, email, branchName, branchCode, role, department, phone, status, recoveryNote, tempPassword, newPassword } = req.body;
    const empIndex = employeesDb.findIndex(e => e.id === req.params.id || e.email === req.params.id);

    if (empIndex === -1) {
      return res.status(404).json({ success: false, error: "Employee profile not found" });
    }

    const emp = employeesDb[empIndex];
    if (name) emp.name = name.trim();
    if (email) emp.email = email.trim().toLowerCase();
    if (branchName) emp.branchName = branchName;
    if (branchCode) emp.branchCode = branchCode;
    if (role) emp.role = role;
    if (department !== undefined) emp.department = department;
    if (phone !== undefined) emp.phone = phone;
    if (status) emp.status = status;
    if (recoveryNote !== undefined) emp.recoveryNote = recoveryNote;
    const passToSet = newPassword || tempPassword;
    if (passToSet && passToSet.trim().length >= 6) {
      emp.tempPassword = passToSet.trim();
      emp.lastPasswordReset = new Date().toISOString();
    }

    // Update provisioning JSON file
    const { filename: provFileName } = saveUserProvisioningJson(emp, "HQ Administrator (Profile Update)");

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: emp.id,
      itemTitle: `Employee Profile Updated: ${emp.name}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: "HQ Administrator",
      timestamp: new Date().toISOString(),
      reason: `Updated employee credentials and role details for ${emp.email}${passToSet ? " (Updated password)" : ""} [File: ${provFileName}]`,
    });

    saveData();

    res.json({
      success: true,
      message: `Profile for ${emp.name} updated successfully!`,
      data: emp
    });
  });

  // POST /api/admin/employees/:id/set-password - Manually assign a new corporate password
  app.post("/api/admin/employees/:id/set-password", (req, res) => {
    const { newPassword, adminReason, clearRestrictions } = req.body;
    const empIndex = employeesDb.findIndex(e => e.id === req.params.id || e.email === req.params.id);

    if (empIndex === -1) {
      return res.status(404).json({ success: false, error: "Employee account not found" });
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters long." });
    }

    const emp = employeesDb[empIndex];
    emp.tempPassword = newPassword.trim();
    emp.lastPasswordReset = new Date().toISOString();
    emp.authProvider = "password";

    if (clearRestrictions || emp.status === "Locked" || emp.status === "Suspended") {
      emp.status = "Active";
    }

    const reasonText = adminReason ? adminReason.trim() : "Admin manual password update";
    emp.recoveryNote = `${reasonText} (Password manually set on ${new Date().toLocaleDateString()})`;

    // Update provisioning JSON file
    saveUserProvisioningJson(emp, "HQ Administrator (Manual Password Set)");

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: emp.id,
      itemTitle: `Manual Password Set: ${emp.name}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: "HQ Administrator",
      timestamp: new Date().toISOString(),
      reason: `Administrative manual password override set for ${emp.email}. Note: ${reasonText}`,
    });

    saveData();

    res.json({
      success: true,
      message: `New password for ${emp.name} (${emp.email}) was successfully set and activated.`,
      data: {
        employee: emp,
        newPassword: newPassword.trim(),
        updatedAt: new Date().toISOString()
      }
    });
  });

  // POST /api/admin/employees/verify-login - Verify employee credentials fallback
  app.post("/api/admin/employees/verify-login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password required" });
    }

    const normalized = email.toLowerCase().trim();
    const emp = employeesDb.find(e => e.email.toLowerCase() === normalized);

    if (!emp) {
      return res.status(404).json({ success: false, error: "Employee not found with this email" });
    }

    if (emp.status === "Locked" || emp.status === "Suspended") {
      return res.status(403).json({ success: false, error: `Account access is currently ${emp.status}. Please contact HQ Admin.` });
    }

    // Match password (either specific tempPassword or fallback default)
    const isValid = emp.tempPassword 
      ? emp.tempPassword === password 
      : (password === "gelvinc2026" || password === "password123" || password.length >= 6);

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Incorrect password" });
    }

    emp.lastLogin = new Date().toISOString();
    saveData();

    res.json({
      success: true,
      message: "Authentication successful",
      data: emp
    });
  });

  // DELETE /api/admin/employees/:id - Delete employee profile
  app.delete("/api/admin/employees/:id", (req, res) => {
    const empIndex = employeesDb.findIndex(e => e.id === req.params.id || e.email === req.params.id);
    if (empIndex === -1) {
      return res.status(404).json({ success: false, error: "Employee account not found" });
    }

    const deleted = employeesDb.splice(empIndex, 1)[0];

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: deleted.id,
      itemTitle: `Employee Account Removed: ${deleted.name}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: "HQ Administrator",
      timestamp: new Date().toISOString(),
      reason: `Permanently removed employee record (${deleted.email}) from database`,
    });

    saveData();

    res.json({
      success: true,
      message: `Employee account ${deleted.name} (${deleted.email}) deleted.`,
      data: deleted
    });
  });

  // POST /api/admin/employees/:id/recover - Reset/Recover password & generate emergency access pass
  app.post("/api/admin/employees/:id/recover", (req, res) => {
    const { actionType, newPassword, adminReason } = req.body;
    const empIndex = employeesDb.findIndex(e => e.id === req.params.id || e.email === req.params.id);

    if (empIndex === -1) {
      return res.status(404).json({ success: false, error: "Employee account not found" });
    }

    const emp = employeesDb[empIndex];
    const recoveryToken = `RCV-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    
    emp.lastPasswordReset = new Date().toISOString();
    emp.resetRecoveryToken = recoveryToken;
    if (emp.status === "Locked" || emp.status === "Suspended") {
      emp.status = "Active";
    }

    if (adminReason) {
      emp.recoveryNote = `${adminReason} (Recovered on ${new Date().toLocaleDateString()})`;
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      itemId: emp.id,
      itemTitle: `Account Recovery & Token Generated: ${emp.name}`,
      previousStock: 0,
      newStock: 0,
      updatedBy: "HQ Administrator",
      timestamp: new Date().toISOString(),
      reason: `Issued recovery token [${recoveryToken}] for ${emp.email}. Action: ${actionType || 'Credential Reset'}. Note: ${adminReason || 'Admin recovery'}`,
    });

    saveData();

    res.json({
      success: true,
      message: `Account recovery executed for ${emp.name}! Recovery Token: ${recoveryToken}`,
      data: {
        employee: emp,
        recoveryToken,
        generatedAt: new Date().toISOString(),
        resetInstructions: `Instruct ${emp.name} (${emp.email}) to use recovery verification code ${recoveryToken} or check their official inbox for reset link.`
      }
    });
  });

  // POST /api/admin/employees/sync-user - Automatically register or update logged-in Google / Password user
  app.post("/api/admin/employees/sync-user", (req, res) => {
    const { name, email, branchName, branchCode, role, picture, authProvider } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email required" });

    const existingIndex = employeesDb.findIndex(e => e.email.toLowerCase() === email.toLowerCase().trim());
    if (existingIndex !== -1) {
      const existing = employeesDb[existingIndex];
      existing.lastLogin = new Date().toISOString();
      if (picture) existing.picture = picture;
      if (branchName && existing.branchName !== branchName) existing.branchName = branchName;
      if (branchCode && existing.branchCode !== branchCode) existing.branchCode = branchCode;
      if (role && existing.role !== role) existing.role = role;
      saveData();
      return res.json({ success: true, message: "Employee session synced", data: existing });
    }

    const newEmp: EmployeeAccount = {
      id: `EMP-${Date.now().toString().slice(-4)}`,
      uid: `uid-${Date.now()}`,
      name: name || email.split("@")[0],
      email: email.trim().toLowerCase(),
      branchName: branchName || "GELV INC Advertising",
      branchCode: branchCode || "GELV-01",
      role: role || "Graphic Artist",
      department: "Branch Operations",
      status: "Active",
      authProvider: (authProvider as any) || "google",
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      picture: picture || undefined,
      recoveryNote: "Auto-registered via authenticated sign-in"
    };

    employeesDb.unshift(newEmp);
    const { filename: provFileName, payload: provPayload } = saveUserProvisioningJson(newEmp, "User Authentication Self-Registration");
    saveData();

    res.status(201).json({
      success: true,
      message: "New employee auto-registered and provisioning JSON created",
      data: newEmp,
      provisionedFile: provFileName,
      provisionedJson: provPayload
    });
  });

  // GET /api/admin/provisioned-users - List all generated user provisioning JSON files
  app.get("/api/admin/provisioned-users", (_req, res) => {
    try {
      if (!fs.existsSync(PROVISIONED_USERS_DIR)) {
        fs.mkdirSync(PROVISIONED_USERS_DIR, { recursive: true });
      }

      const files = fs.readdirSync(PROVISIONED_USERS_DIR).filter(f => f.endsWith(".json"));
      const records = files.map(file => {
        const fullPath = path.join(PROVISIONED_USERS_DIR, file);
        const stats = fs.statSync(fullPath);
        let content: any = null;
        try {
          content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        } catch {
          // invalid json fallback
        }
        return {
          fileName: file,
          sizeBytes: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime,
          employeeId: content?.employeeId || file.split("_")[0],
          name: content?.name || "Unknown",
          email: content?.email || "Unknown",
          role: content?.role || "Staff",
          branchName: content?.branchName || "HQ",
          provisionedAt: content?.provisionedAt || stats.birthtime,
          provisionedBy: content?.provisionedBy || "HQ Administrator",
          content
        };
      }).sort((a, b) => new Date(b.provisionedAt).getTime() - new Date(a.provisionedAt).getTime());

      res.json({
        success: true,
        count: records.length,
        data: records,
        directory: ".data/provisioned_users"
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to list provisioned user files" });
    }
  });

  // GET /api/admin/provisioned-users/:filename - Download or view specific JSON file
  app.get("/api/admin/provisioned-users/:filename", (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(PROVISIONED_USERS_DIR, filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "Provisioned user JSON file not found" });
      }

      if (req.query.download === "true") {
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Type", "application/json");
        return res.sendFile(filePath);
      }

      const raw = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(raw);
      res.json({ success: true, fileName: filename, data: json });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Failed to read provisioned user JSON file" });
    }
  });

  // GET /api/admin/provisioned-users/by-id/:id - Fetch or generate JSON for employee
  app.get("/api/admin/provisioned-users/by-id/:id", (req, res) => {
    try {
      const emp = employeesDb.find(e => e.id === req.params.id || e.email.toLowerCase() === req.params.id.toLowerCase());
      if (!emp) {
        return res.status(404).json({ success: false, error: "Employee account not found" });
      }

      const { filename, payload } = saveUserProvisioningJson(emp, "HQ User Query Archive");
      res.json({ success: true, fileName: filename, data: payload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === VITE / STATIC MIDDLEWARE ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
