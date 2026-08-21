import { jsPDF } from "jspdf";
import { Inquiry, AdItem, BranchRequest } from "../types";

export interface PDFGenerationResult {
  doc: jsPDF;
  dataUrl: string;
  blob: Blob;
  filename: string;
}

export function generateRequestPDF(
  inquiry: Partial<Inquiry>,
  item?: AdItem | null
): PDFGenerationResult {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const margin = 15;
  let y = 20;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GELV INC ADVERTISING", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Official Tarpaulin, Signage & Media Space Reservation Form", margin, 25);

  // Status Badge in top right
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.roundedRect(pageWidth - margin - 35, 12, 35, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CONFIRMED", pageWidth - margin - 32, 17.5);

  y = 45;

  // Document Info Bar
  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, "F");

  doc.setTextColor(51, 65, 85); // slate-700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Request Reference ID:`, margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`${inquiry.id || "REQ-DRAFT"}`, margin + 42, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`Created Date:`, margin + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : new Date().toLocaleString()}`,
    margin + 28,
    y + 12
  );

  doc.setFont("helvetica", "bold");
  doc.text(`Dispatch Status:`, pageWidth - margin - 60, y + 9);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text(`Sent to Site Admins`, pageWidth - margin - 32, y + 9);

  y += 24;

  // Section 1: Client Information
  doc.setFillColor(226, 232, 240); // slate-200
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. CLIENT & AUTHENTICATION DETAILS", margin + 3, y + 5);

  y += 10;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Google Account User:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${inquiry.userName || "Verified Google User"}`, margin + 42, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Verified Email:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${inquiry.userEmail || "N/A"}`, margin + 42, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Authentication Mode:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text("Google Identity OAuth Session", margin + 42, y);

  y += 12;

  // Section 2: Advertising Item Information
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. ADVERTISING ASSET DETAILS", margin + 3, y + 5);

  y += 10;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Asset Title:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${inquiry.itemTitle || item?.title || "Advertising Space"}`, margin + 42, y);

  if (item) {
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Category:", margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.category}`, margin + 42, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Dimensions / Thickness:", margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.dimensions || "Standard"} ${item.thickness ? `• ${item.thickness}` : ""}`, margin + 42, y);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Daily Reach / Impressions:", margin + 3, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${item.dailyImpressions.toLocaleString()} daily audience`, margin + 42, y);
  }

  y += 12;

  // Section 3: Campaign & Financial Schedule
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. CAMPAIGN SCHEDULE & FINANCIAL INVESTMENTS", margin + 3, y + 5);

  y += 10;

  // Table Headers
  const col1 = margin + 3;
  const col2 = margin + 65;
  const col3 = margin + 110;
  const col4 = margin + 145;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("TERM", col1, y + 5.5);
  doc.text("UNITS & DURATION", col2, y + 5.5);
  doc.text("START DATE", col3, y + 5.5);
  doc.text("INVESTMENT", col4, y + 5.5);

  y += 8;

  // Table Data Row
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  doc.text(`${inquiry.durationDays || 7} Days Campaign`, col1, y + 6);
  doc.text(`${inquiry.requestedUnits || 1} Unit(s)`, col2, y + 6);
  doc.text(`${inquiry.startDate || "Immediate"}`, col3, y + 6);

  const totalAmountStr = inquiry.totalAmount
    ? `$${inquiry.totalAmount.toLocaleString()}`
    : "$0.00";
  doc.setFont("helvetica", "bold");
  doc.text(totalAmountStr, col4, y + 6);

  y += 12;

  // Summary box
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(191, 219, 254); // blue-200
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, "FD");

  doc.setTextColor(30, 58, 138); // blue-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL CONTRACT VALUE:", margin + 5, y + 8);

  doc.setFontSize(14);
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(totalAmountStr, margin + 58, y + 8.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(
    "Hold status: Reserved in GELV INC Advertising inventory. Stock automatically decremented in central server.",
    margin + 5,
    y + 15
  );

  y += 30;

  // Section 4: Admin Dispatch & Security Audit Seal
  doc.setLineWidth(0.3);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);

  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("AUTOMATED ADMIN NOTIFICATION DISPATCH", margin, y);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    "A PDF copy of this request form has been compiled and dispatched to all connected site administrators:",
    margin,
    y
  );

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(
    "• Primary Dispatch Recipient: jade.gelv8@gmail.com\n• Operations Team: admin@gelvinc.com\n• GELV INC Central Inventory Real-time Database",
    margin + 3,
    y
  );

  y += 14;

  // Footer Signature Line
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 275, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("GELV INC Advertising Inventory Management System", margin, 283);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Generated automatically via Google Account verified portal.", margin, 288);

  const filename = `GELV_INC_Advertising_Request_${inquiry.id || "REQ"}.pdf`;
  const dataUrl = doc.output("datauristring");
  const blob = doc.output("blob");

  return { doc, dataUrl, blob, filename };
}

export function generateBranchRequestPDF(
  request: BranchRequest
): PDFGenerationResult {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const margin = 15;
  let y = 20;

  // Header Banner Background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 35, "F");

  // Title in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("GELV INC ADVERTISING - HQ", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Official Branch Inventory Requisition & Material Order Form", margin, 25);

  // Status Badge in top right
  if (request.status === "Approved & Dispatched") {
    doc.setFillColor(16, 185, 129); // emerald-500
  } else if (request.status === "Declined") {
    doc.setFillColor(239, 68, 68); // red-500
  } else {
    doc.setFillColor(245, 158, 11); // amber-500
  }
  doc.roundedRect(pageWidth - margin - 45, 12, 45, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text((request.status || "PENDING").toUpperCase(), pageWidth - margin - 42, 17.5);

  y = 45;

  // Document Info Bar
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, "F");

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Requisition Ref ID:`, margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.id}`, margin + 35, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text(`Originating Branch:`, margin + 4, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.branchName} (${request.branchCode})`, margin + 35, y + 13);

  doc.setFont("helvetica", "bold");
  doc.text(`Priority Level:`, pageWidth - margin - 60, y + 6);
  doc.setTextColor(request.priority === "Emergency Restock" ? 220 : 37, request.priority === "Emergency Restock" ? 38 : 99, 235);
  doc.text(`${request.priority}`, pageWidth - margin - 35, y + 6);

  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "bold");
  doc.text(`Required By:`, pageWidth - margin - 60, y + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.requiredByDate}`, pageWidth - margin - 35, y + 13);

  y += 26;

  // Section 1: Branch Requester Details
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("1. BRANCH REQUESTER & CONTACT DETAILS", margin + 3, y + 5);

  y += 10;
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);

  doc.setFont("helvetica", "bold");
  doc.text("Requester Name:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.requesterName}`, margin + 40, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Role / Position:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.requesterRole}`, margin + 40, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Branch Email:", margin + 3, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${request.requesterEmail}`, margin + 40, y);

  y += 12;

  // Section 2: Requisition Items List
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. REQUESTED MATERIALS FROM HQ WAREHOUSE", margin + 3, y + 5);

  y += 10;

  // Table Headers
  const col1 = margin + 3;
  const col2 = margin + 80;
  const col3 = margin + 120;
  const col4 = margin + 155;

  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageWidth - margin * 2, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("MATERIAL / ITEM TITLE", col1, y + 5.5);
  doc.text("CATEGORY", col2, y + 5.5);
  doc.text("DIMENSIONS", col3, y + 5.5);
  doc.text("QTY REQ.", col4, y + 5.5);

  y += 8;

  // Table Data Rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  request.items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
    }
    const brandPrefix = item.brand ? `[${item.brand}] ` : item.isCustom ? "[Custom] " : "";
    const fullTitle = `${brandPrefix}${item.itemTitle}`;
    const truncatedTitle = fullTitle.length > 40 ? fullTitle.substring(0, 38) + "..." : fullTitle;
    doc.text(truncatedTitle, col1, y + 5);
    doc.text(item.category, col2, y + 5);
    doc.text(item.dimensions || item.specs || "Standard", col3, y + 5);
    doc.setFont("helvetica", "bold");
    const unitLabel = item.unit ? `${item.requestedQuantity} ${item.unit}` : `${item.requestedQuantity} units`;
    doc.text(unitLabel, col4, y + 5);
    doc.setFont("helvetica", "normal");
    y += 7;
  });

  y += 6;

  // Section 3: Purpose & Remarks
  doc.setFillColor(226, 232, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. PROJECT PURPOSE & BRANCH REMARKS", margin + 3, y + 5);

  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 18, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const purposeText = request.purpose || "General branch inventory replenishment for upcoming client installations and local store orders.";
  const splitPurpose = doc.splitTextToSize(purposeText, pageWidth - margin * 2 - 10);
  doc.text(splitPurpose, margin + 5, y + 6);

  y += 24;

  // HQ Signoff & Logistics Dispatch Section
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 2, 2, "FD");

  doc.setTextColor(30, 58, 138);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("HEADQUARTERS DISPATCH, LOGISTICS & AUDIT APPROVAL", margin + 5, y + 6);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`• HQ Reviewer / Recipient: jade.gelv8@gmail.com`, margin + 5, y + 11);
  doc.text(`• HQ Status: ${request.status}`, margin + 5, y + 16);
  
  if (request.shippingStatus || request.courierName || request.trackingNumber) {
    const courierStr = request.courierName ? `via ${request.courierName}` : "";
    const trackStr = request.trackingNumber ? `(Tracking/Waybill: ${request.trackingNumber})` : "";
    const etaStr = request.estimatedDeliveryDate ? `• ETA: ${request.estimatedDeliveryDate}` : "";
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 64, 175);
    doc.text(`• Shipping Status: ${request.shippingStatus || "Dispatched"} ${courierStr} ${trackStr} ${etaStr}`, margin + 5, y + 21);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
  } else {
    doc.text(`• Logistics Status: Pending HQ Dispatch Schedule`, margin + 5, y + 21);
  }

  if (request.hqNotes) {
    doc.text(`• HQ Operations Remarks: ${request.hqNotes}`, margin + 5, y + 26);
  } else {
    doc.text(`• HQ Operations Center: Official automated dispatch log transmitted to ${request.requesterEmail}`, margin + 5, y + 26);
  }

  // Footer Signature Line
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 275, pageWidth, 22, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("GELV INC Advertising - Branch Requisition Portal", margin, 283);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Official HQ Supply Chain Document. Confidential & Internal Use Only.", margin, 288);

  const filename = `GELV_Branch_Requisition_${request.id}.pdf`;
  const dataUrl = doc.output("datauristring");
  const blob = doc.output("blob");

  return { doc, dataUrl, blob, filename };
}
