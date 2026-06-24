export type Role = 'super_admin' | 'admin' | 'manager' | 'mechanic' | 'developer';

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
}

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
  admin: 'ადმინისტრატორი',
  manager: 'მენეჯერი',
  mechanic: 'ხელოსანი',
  developer: 'პროგ. ადმინი',
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

export const DEFAULT_CAR_BRANDS: CarBrand[] = [
  { id: 'cb-mb', name: 'MERCEDES-BENZ' },
  { id: 'cb-daf', name: 'DAF' },
  { id: 'cb-scania', name: 'SCANIA' },
  { id: 'cb-man', name: 'MAN' },
  { id: 'cb-iveco', name: 'IVECO' },
  { id: 'cb-volvo', name: 'VOLVO' },
  { id: 'cb-renault', name: 'RENAULT' },
];

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
  return user.role === 'super_admin' || user.role === 'developer' || (user.enabledModules ?? []).includes(mod);
}

/** Returns true for roles that have dashboard/admin-like access */
export function isAdminRole(role: Role): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'manager' || role === 'developer';
}

/** Returns true for roles that have OWNER-level full access (super_admin and manager are equivalent) */
export function isOwnerLike(role: Role): boolean {
  return role === 'super_admin' || role === 'manager';
}
