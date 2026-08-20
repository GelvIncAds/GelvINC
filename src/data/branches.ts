export interface BranchInfo {
  name: string;
  code: string;
  location: string;
  badgeColor?: string;
  managerRole?: string;
  roles?: string[];
  description?: string;
}

export const MANAGER_ROLES_CATALOG = [
  "Artist",
  "Branch Manager",
  "Branch Manager / Artist",
  "Main Operations Manager",
  "Branch Production Lead",
  "Studio Branch Manager",
  "Branch Dispatch Lead",
  "Graphic Artist / Layout Specialist",
  "Production Artist",
  "Store Supervisor",
  "Inventory Specialist",
] as const;

export type ManagerRoleType = (typeof MANAGER_ROLES_CATALOG)[number] | string;

export const OFFICIAL_BRANCHES: BranchInfo[] = [
  {
    name: "GELV INC Advertising",
    code: "GELV-01",
    location: "Main Office - Door 11, TDRC BLDG, Sucat, Paranaque",
    badgeColor: "#2C28B5",
    managerRole: "Main Operations Manager",
    roles: ["Main Operations Manager", "Artist", "Inventory Specialist"],
    description: "Primary headquarters facility and central distribution warehouse.",
  },
  {
    name: "Great Print & Sign",
    code: "GPS-02",
    location: "Door 0, TDRC BLDG, Sucat, Paranaque",
    badgeColor: "#F0593C",
    managerRole: "Branch Production Lead",
    roles: ["Branch Production Lead", "Artist", "Store Supervisor"],
    description: "Specializes in large format printing and billboard substrates.",
  },
  {
    name: "VG Formera",
    code: "VGF-03",
    location: "BF Homes, Paranaque",
    badgeColor: "#E62792",
    managerRole: "Branch Manager / Artist",
    roles: ["Branch Manager", "Artist", "Graphic Artist / Layout Specialist"],
    description: "Storefront panaflex, acrylic signage, and industrial frames.",
  },
  {
    name: "Kulay Advertising",
    code: "KUL-04",
    location: "Victor Medina, Kabihasnan, Paranque",
    badgeColor: "#FFF50F",
    managerRole: "Studio Branch Manager",
    roles: ["Studio Branch Manager", "Artist", "Color Specialist"],
    description: "High-DPI photo papers, vinyl stickers, and color-accurate branding.",
  },
  {
    name: "Taytay Print & Sign",
    code: "TPS-05",
    location: "Mayujane BLDG, East Road, Rizal",
    badgeColor: "#121212",
    managerRole: "Branch Dispatch Lead",
    roles: ["Branch Dispatch Lead", "Artist", "Fabrication Lead"],
    description: "Regional distribution and rapid turnaround sign fabrication.",
  },
];

