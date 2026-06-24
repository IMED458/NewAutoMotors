import { useState } from 'react';
import { Product, ProductSale, CarServiceOrder, DailyClosing, ServiceItem, User } from '../types';
import { ShoppingBag, Package, CalendarCheck } from 'lucide-react';
import POSSection from './POSSection';
import ProductsSection from './ProductsSection';
import DayClosingSection from './DayClosingSection';

interface ShopViewProps {
  products: Product[];
  orders: CarServiceOrder[];
  productSales: ProductSale[];
  dailyClosings: DailyClosing[];
  services: ServiceItem[];
  currentUser: User;
  onAddProduct: (prod: Omit<Product, 'id' | 'soldQuantity' | 'createdAt'>) => void;
  onEditProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onRefillStock: (productId: string, qty: number, price: number, note: string) => void;
  onAddSale: (sale: Omit<ProductSale, 'id' | 'createdAt'>) => void;
  onConfirmCloseDay: (closing: Omit<DailyClosing, 'id' | 'createdAt'>) => void;
}

type ShopTab = 'pos' | 'products' | 'closing';

export default function ShopView({
  products, orders, productSales, dailyClosings, services,
  currentUser, onAddProduct, onEditProduct, onDeleteProduct,
  onRefillStock, onAddSale, onConfirmCloseDay,
}: ShopViewProps) {
  const [tab, setTab] = useState<ShopTab>('pos');
  const isPrivileged = ['super_admin', 'admin', 'manager'].includes(currentUser.role);

  return (
    <div className="pb-20">
      {/* Shop sub-nav */}
      <div className="flex bg-slate-900 border-b border-slate-800 px-4 pt-2">
        {([
          { id: 'pos', label: 'POS გაყიდვა', icon: ShoppingBag },
          { id: 'products', label: 'საქონელი', icon: Package },
          { id: 'closing', label: 'დღის დახურვა', icon: CalendarCheck },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              tab === t.id ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-3">
        {tab === 'pos' && (
          <POSSection
            products={products}
            orders={orders}
            onAddSale={onAddSale}
            currentUser={currentUser}
          />
        )}
        {tab === 'products' && (
          <ProductsSection
            products={products}
            currentUser={{ role: currentUser.role as any, firstName: currentUser.firstName, lastName: currentUser.lastName }}
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onRefillStock={onRefillStock}
          />
        )}
        {tab === 'closing' && (
          <DayClosingSection
            orders={orders}
            services={services}
            productSales={productSales}
            dailyClosings={dailyClosings}
            currentUser={{ role: currentUser.role as any, firstName: currentUser.firstName, lastName: currentUser.lastName }}
            onConfirmCloseDay={onConfirmCloseDay}
          />
        )}
      </div>
    </div>
  );
}
