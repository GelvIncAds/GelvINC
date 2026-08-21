export interface BranchInfo {
  name: string;
  code: string;
  location: string;
  badgeColor?: string;
  managerRole?: string;
  roles?: string[];
  description?: string;
}

export const COMPANY_ROLES = [
  "Branch Manager",
  "Graphic Artist",
  "Admin Assistant",
  "Admin Executive",
  "Sales Assistant",
  "Sales Executive",
  "Field Supervisor",
  "Logistics",
  "CEO",
  "Operations Manager",
] as const;

export const MANAGER_ROLES_CATALOG = COMPANY_ROLES;

export type CompanyRole = (typeof COMPANY_ROLES)[number];
export type ManagerRoleType = CompanyRole | string;

export const OFFICIAL_BRANCHES: BranchInfo[] = [
  {
    name: "GELV INC Advertising",
    code: "GELV-01",
    location: "Main Office - Door 11, TDRC BLDG, Sucat, Paranaque",
    badgeColor: "#2C28B5",
    managerRole: "CEO",
    roles: ["CEO", "Operations Manager", "Admin Executive", "Admin Assistant", "Logistics"],
    description: "Primary headquarters facility and central distribution warehouse.",
  },
  {
    name: "Great Print & Sign",
    code: "GPS-02",
    location: "Door 0, TDRC BLDG, Sucat, Paranaque",
    badgeColor: "#F0593C",
    managerRole: "Branch Manager",
    roles: ["Branch Manager", "Graphic Artist", "Sales Executive", "Logistics"],
    description: "Specializes in large format printing and billboard substrates.",
  },
  {
    name: "VG Formera",
    code: "VGF-03",
    location: "BF Homes, Paranaque",
    badgeColor: "#E62792",
    managerRole: "Branch Manager",
    roles: ["Branch Manager", "Graphic Artist", "Sales Assistant"],
    description: "Storefront panaflex, acrylic signage, and industrial frames.",
  },
  {
    name: "Kulay Advertising",
    code: "KUL-04",
    location: "Victor Medina, Kabihasnan, Paranque",
    badgeColor: "#FFF50F",
    managerRole: "Branch Manager",
    roles: ["Branch Manager", "Graphic Artist", "Sales Executive"],
    description: "High-DPI photo papers, vinyl stickers, and color-accurate branding.",
  },
  {
    name: "Taytay Print & Sign",
    code: "TPS-05",
    location: "Mayujane BLDG, East Road, Rizal",
    badgeColor: "#121212",
    managerRole: "Branch Manager",
    roles: ["Branch Manager", "Graphic Artist", "Field Supervisor", "Logistics"],
    description: "Regional distribution and rapid turnaround sign fabrication.",
  },
];

