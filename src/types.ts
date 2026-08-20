export type AdCategory =
  | 'Tarpaulin'
  | 'Panaflex'
  | 'Stickers'
  | 'Photopapers'
  | 'Paperstocks'
  | 'Inks'
  | 'Films';

export interface AdItemSpecs {
  resolution?: string;
  operatingHours?: string;
  minLoopFrequency?: string;
  targetDemographic?: string;
  peakHours?: string;
  spotDurationSec?: number;
}

export interface AdItem {
  id: string;
  sku?: string;
  brand?: string;
  title: string;
  category: AdCategory;
  location: string;
  city: string;
  dimensions: string;
  thickness?: string;
  dailyImpressions: number;
  dailyPrice?: number;
  stock: number;
  totalCapacity: number;
  status: 'Available' | 'Low Stock' | 'Sold Out' | 'Under Maintenance';
  imageUrl: string;
  description: string;
  specs: AdItemSpecs;
  lastUpdated: string;
}

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  givenName?: string;
  branchName?: string;
  branchCode?: string;
  role?: string;
}

export interface Inquiry {
  id: string;
  itemId: string;
  itemTitle: string;
  userEmail: string;
  userName: string;
  durationDays: number;
  requestedUnits: number;
  startDate: string;
  totalAmount: number;
  status: 'Pending' | 'Confirmed' | 'Completed';
  createdAt: string;
  pdfDataUrl?: string;
  sentToAdmins?: string[];
}

export interface BranchRequestItem {
  itemId: string;
  itemTitle: string;
  category: AdCategory | string;
  requestedQuantity: number;
  sku?: string;
  brand?: string;
  dimensions?: string;
  thickness?: string;
  specs?: string;
  unitPrice?: number;
  unit?: string;
  notes?: string;
  isCustom?: boolean;
}

export interface BranchRequestNotification {
  id: string;
  type: 'Approval Notice' | 'Shipped Out' | 'Delivered' | 'General Update' | 'Waybill & Shipment Dispatched';
  title: string;
  message: string;
  timestamp: string;
  sentBy: string;
  recipientEmail: string;
  delivered?: boolean;
  details?: {
    shippingStatus?: string;
    courierName?: string;
    trackingNumber?: string;
    estimatedDeliveryDate?: string;
  };
}

export interface BranchRequest {
  id: string;
  branchName: string;
  branchCode: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  requiredByDate: string;
  priority: 'Normal' | 'High Priority' | 'Emergency Restock';
  purpose: string;
  items: BranchRequestItem[];
  status: 'Pending HQ Review' | 'Approved & Dispatched' | 'Partial Delivery' | 'Completed' | 'Declined';
  shippingStatus?: 'Pending Fulfillment' | 'Preparing for Dispatch' | 'Shipped Out & En Route' | 'Delivered' | 'Ready for Pickup';
  courierName?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  shippedAt?: string;
  deliveredAt?: string;
  lastNotifiedAt?: string;
  notifications?: BranchRequestNotification[];
  createdAt: string;
  updatedAt: string;
  hqNotes?: string;
  pdfDataUrl?: string;
  dispatchedToEmail?: string;
  sentToEmails?: string[];
}

export interface StockAuditLog {
  id: string;
  itemId: string;
  itemTitle: string;
  previousStock: number;
  newStock: number;
  updatedBy: string;
  timestamp: string;
  reason: string;
}

export interface InventoryStats {
  totalItems: number;
  totalStockAvailable: number;
  totalDailyReach: number;
  lowStockCount: number;
  soldOutCount: number;
  categoriesCount: Record<string, number>;
}
