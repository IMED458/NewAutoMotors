export type Role =
  | 'super_admin'       // მფლობელი (owner) — full access, profit owner
  | 'general_manager'   // გენერალური მენეჯერი — sees everything, owner-like
  | 'service_manager'   // სერვის მენეჯერი — manages own boxes & mechanics
  | 'mechanic'          // ხელოსანი
  | 'shop'              // მაღაზია — shop module only
  | 'cashier'           // მოლარე
  | 'accountant'        // ბუღალტერი
  | 'developer';        // პროგ. ანალიტიკოსი (hidden system account)

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  passwordHash: string;
  role: Role;
  enabledModules?: string[]; // e.g. ['shop', 'day_closing', 'reports']
  createdAt: string;
}

export type OrderStatus = 'new' | 'pending' | 'completed';
export type PaymentStatus = 'paid' | 'unpaid';

export interface CarServiceOrder {
  id: string;
  date: string;
  carBrand: string;
  carNumber: string;
  clientFullName: string;
  clientPhone: string;
  problemDescription: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paidTo?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignedEmployeeIds?: string[];   // employees assigned to this order
  assignedServiceType?: string;     // optional service type hint at registration
  boxId?: string;                   // box this car is handled in
  serviceManagerId?: string;        // responsible service manager for this order
  /** Who brought the client: a mechanic found them, or the service brought them. */
  clientSource?: ClientSource;
}

/** Who sourced the client — drives the revenue-share profile. */
export type ClientSource = 'mechanic' | 'service';

/** A physical work bay/box, managed by a service manager, staffed by mechanics. */
export interface Box {
  id: string;
  name: string;
  serviceManagerId?: string;  // the managing service manager
  mechanicIds: string[];      // mechanics permanently working in this box
  createdAt: string;
}

/**
 * Global, editable revenue-share configuration.
 * Percentages of a service's price that go to the mechanic and the service
 * manager; the owner keeps the remainder. Two profiles depending on who
 * brought the client.
 */
export interface RevenueShareConfig {
  id: string; // always 'global'
  mechanicSourced: { mechanicPct: number; serviceManagerPct: number };
  serviceSourced: { mechanicPct: number; serviceManagerPct: number };
}

export const DEFAULT_REVENUE_SHARE: RevenueShareConfig = {
  id: 'global',
  // Mechanic found the client → mechanic gets more, manager less
  mechanicSourced: { mechanicPct: 50, serviceManagerPct: 10 },
  // Service/manager brought the client → manager gets more, mechanic less
  serviceSourced: { mechanicPct: 40, serviceManagerPct: 20 },
};

export type ServiceType = string;

export interface ServiceTypeConfig {
  id: string;
  name: string;
  percentageReward: number;
  flatReward: number;
  rewardType: 'percentage' | 'flat';
  employeeRewards?: Record<string, {
    rewardType: 'percentage' | 'flat';
    percentageReward: number;
    flatReward: number;
    coMechanicId?: string;
    coMechanicRewardType?: 'flat' | 'percentage';
    coMechanicEarning?: number;
  }>;
  coMechanicId?: string;            // permanently assigned second executor for this service
  coMechanicRewardType?: 'flat' | 'percentage'; // how the co-executor earning is calculated
  coMechanicEarning?: number;       // flat amount OR percentage value (depending on rewardType)
}

export interface ServiceItem {
  id: string;
  orderId: string;
  serviceType: string;
  description: string;
  price: number;
  mechanicId: string;
  mechanicEarning: number;
  coMechanicId?: string;
  coMechanicEarning?: number;
  serviceManagerId?: string;        // service manager who earns a cut on this service
  serviceManagerEarning?: number;   // the manager's cut (₾)
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  brand: string;
  description: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  photoUrl: string;
  status: 'active' | 'inactive';
  soldQuantity: number;
  createdAt: string;
}

export interface ProductSaleItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
}

export interface ProductSale {
  id: string;
  clientName: string;
  clientPhone: string;
  carBrand: string;
  carNumber: string;
  date: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'cash' | 'card' | 'tbc' | 'bog' | 'transfer' | 'mixed';
  mixedPaymentDetails?: { cash: number; card: number; tbc: number; bog: number; transfer: number };
  items: ProductSaleItem[];
  createdBy: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'refill' | 'sale' | 'adjustment';
  quantity: number;
  purchasePrice: number;
  date: string;
  note: string;
  operatorName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userFullName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  startTime: string;
  closingTime: string;
  totalReceived: number;
  totalOutstanding: number;
  productSalesCount: number;
  servicesCount: number;
  productRevenue: number;
  serviceRevenue: number;
  productProfit: number;
  totalCash: number;
  totalCard: number;
  totalTbc: number;
  totalBog: number;
  totalTransfer: number;
  itemsSold: any[];
  servicesDone: any[];
  closedBy: string;
  note: string;
  createdAt: string;
}

export interface CarBrand {
  id: string;
  name: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: 'მფლობელი',
  general_manager: 'გენერალური მენეჯერი',
  service_manager: 'სერვის მენეჯერი',
  mechanic: 'ხელოსანი',
  shop: 'მაღაზია',
  cashier: 'მოლარე',
  accountant: 'ბუღალტერი',
  developer: 'პროგ. ანალიტიკოსი',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'ახალი',
  pending: 'პროცესშია',
  completed: 'დასრულებულია',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'გადახდილია',
  unpaid: 'გადაუხდელია',
};

export const DEFAULT_SERVICE_CONFIGS: ServiceTypeConfig[] = [
  { id: 'diagnostic', name: 'დიაგნოსტიკა', percentageReward: 0, flatReward: 30, rewardType: 'flat' },
  { id: 'electromechanics', name: 'ელექტრო მექანიკა', percentageReward: 50, flatReward: 0, rewardType: 'percentage' },
  { id: 'other', name: 'სხვა სამუშაოები', percentageReward: 50, flatReward: 0, rewardType: 'percentage' },
];

// Comprehensive list of car / truck / commercial vehicle brands.
const CAR_BRAND_NAMES: string[] = [
  // Trucks & commercial (kept first for this auto-service context)
  'MERCEDES-BENZ', 'MAN', 'SCANIA', 'DAF', 'IVECO', 'VOLVO', 'RENAULT',
  'KAMAZ', 'MAZ', 'KRAZ', 'GAZ', 'ZIL', 'URAL', 'ISUZU', 'HINO', 'FUSO',
  'FREIGHTLINER', 'KENWORTH', 'PETERBILT', 'INTERNATIONAL', 'MACK', 'WESTERN STAR',
  // Passenger & SUV
  'TOYOTA', 'LEXUS', 'HONDA', 'ACURA', 'NISSAN', 'INFINITI', 'MAZDA',
  'MITSUBISHI', 'SUBARU', 'SUZUKI', 'DAIHATSU', 'ISUZU MOTORS',
  'HYUNDAI', 'KIA', 'GENESIS', 'SSANGYONG', 'DAEWOO',
  'VOLKSWAGEN', 'AUDI', 'BMW', 'MINI', 'PORSCHE', 'OPEL', 'SKODA', 'SEAT', 'CUPRA',
  'FORD', 'LINCOLN', 'CHEVROLET', 'CADILLAC', 'BUICK', 'GMC', 'DODGE', 'CHRYSLER',
  'JEEP', 'RAM', 'TESLA', 'RIVIAN', 'LUCID',
  'FIAT', 'ALFA ROMEO', 'LANCIA', 'MASERATI', 'FERRARI', 'LAMBORGHINI', 'PAGANI', 'ABARTH',
  'PEUGEOT', 'CITROEN', 'DS', 'DACIA', 'BUGATTI',
  'JAGUAR', 'LAND ROVER', 'ROVER', 'ASTON MARTIN', 'BENTLEY', 'ROLLS-ROYCE',
  'LOTUS', 'MCLAREN', 'MG', 'VAUXHALL',
  'VOLVO CARS', 'POLESTAR', 'SAAB',
  'LADA', 'UAZ', 'MOSKVICH',
  // Chinese
  'BYD', 'CHERY', 'GEELY', 'GREAT WALL', 'HAVAL', 'JAC', 'LIFAN', 'FAW',
  'DONGFENG', 'FOTON', 'BAIC', 'BRILLIANCE', 'ZOTYE', 'HONGQI', 'NIO',
  'XPENG', 'LI AUTO', 'MAXUS', 'WULING', 'CHANGAN', 'GAC', 'OMODA', 'JAECOO',
  // Other / misc
  'SMART', 'HUMMER', 'SCION', 'PONTIAC', 'SATURN', 'OLDSMOBILE', 'MERCURY',
  'TATA', 'MAHINDRA', 'PROTON', 'PERODUA', 'VINFAST',
];

export const DEFAULT_CAR_BRANDS: CarBrand[] = CAR_BRAND_NAMES.map(name => ({
  id: 'cb-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  name,
}));

export function calculateMechanicEarning(
  serviceType: string,
  price: number,
  configs?: ServiceTypeConfig[],
  employeeId?: string
): number {
  const activeConfigs = configs || DEFAULT_SERVICE_CONFIGS;
  const conf = activeConfigs.find((c) => c.id === serviceType);
  if (conf) {
    if (employeeId && conf.employeeRewards?.[employeeId]) {
      const er = conf.employeeRewards[employeeId];
      return er.rewardType === 'flat'
        ? er.flatReward
        : Number(((price * er.percentageReward) / 100).toFixed(2));
    }
    return conf.rewardType === 'flat'
      ? conf.flatReward
      : Number(((price * conf.percentageReward) / 100).toFixed(2));
  }
  if (serviceType === 'diagnostic') return 30;
  return Number((price * 0.5).toFixed(2));
}

export function hasModule(user: User, mod: string): boolean {
  return isOwnerLike(user.role) || user.role === 'developer' || (user.enabledModules ?? []).includes(mod);
}

/** Returns true for roles that have the orders dashboard / admin-like access */
export function isAdminRole(role: Role): boolean {
  return role === 'super_admin' || role === 'general_manager' || role === 'service_manager' || role === 'developer';
}

/**
 * Roles with OWNER-level full access to everything.
 * - super_admin: მფლობელი (owner)
 * - general_manager: გენერალური მენეჯერი (sees everything, owner-like)
 * - developer: პროგ. ადმინისტრატორი — full unrestricted access (manages the
 *   whole program, adds users, sees absolutely everything). Still hidden from
 *   personnel lists and never counted in salaries/profit.
 */
export function isOwnerLike(role: Role): boolean {
  return role === 'super_admin' || role === 'general_manager' || role === 'developer';
}

/** Shop-floor roles whose access is limited to specific modules (no orders dashboard) */
export function isLimitedModuleRole(role: Role): boolean {
  return role === 'shop' || role === 'cashier' || role === 'accountant';
}

/** Boxes managed by a given service manager. */
export function boxesForManager(boxes: Box[], managerId: string): Box[] {
  return boxes.filter(b => b.serviceManagerId === managerId);
}

/** Distinct mechanic ids that belong to a given service manager's boxes. */
export function mechanicIdsForManager(boxes: Box[], managerId: string): string[] {
  const ids = new Set<string>();
  boxes.filter(b => b.serviceManagerId === managerId)
    .forEach(b => (b.mechanicIds || []).forEach(id => ids.add(id)));
  return Array.from(ids);
}

/** Split a service price into mechanic / service-manager / owner shares. */
export function computeRevenueShares(
  price: number,
  source: ClientSource | undefined,
  cfg: RevenueShareConfig | undefined
): { mechanicEarning: number; serviceManagerEarning: number; ownerEarning: number } {
  const c = cfg || DEFAULT_REVENUE_SHARE;
  const profile = source === 'service' ? c.serviceSourced : c.mechanicSourced;
  const mechanicEarning = Number(((price * profile.mechanicPct) / 100).toFixed(2));
  const serviceManagerEarning = Number(((price * profile.serviceManagerPct) / 100).toFixed(2));
  const ownerEarning = Number((price - mechanicEarning - serviceManagerEarning).toFixed(2));
  return { mechanicEarning, serviceManagerEarning, ownerEarning };
}
