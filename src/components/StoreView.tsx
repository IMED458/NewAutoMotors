import React, { useState, useEffect } from 'react';
import { Product, ProductSale, InventoryMovement, DailyClosing, AuditLog, Role, User, CarServiceOrder, ServiceItem } from '../types';
import { INITIAL_PRODUCTS, INITIAL_PRODUCT_SALES, INITIAL_INVENTORY_MOVEMENTS, INITIAL_DAILY_CLOSINGS } from '../utils/initialStoreData';
import POSSection from './POSSection';
import ProductsSection from './ProductsSection';
import DayClosingSection from './DayClosingSection';
import DebtsSection from './DebtsSection';
import StoreAnalytics from './StoreAnalytics';
import { ShoppingCart, Package, ShieldCheck, Landmark, BarChart3, AppWindow } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StoreViewProps {
  currentUser: User | null;
  orders: CarServiceOrder[];
  services: ServiceItem[];
}

export default function StoreView({ currentUser, orders, services }: StoreViewProps) {
  // 1. Core Reactive States synchronized through LocalStorage
  const [products, setProducts] = useState<Product[]>([]);
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [activeTab, setActiveTab] = useState<'pos' | 'products' | 'closing' | 'debts' | 'analytics'>('pos');

  // Load state on mount
  useEffect(() => {
    // Products
    const savedProducts = localStorage.getItem('auto_service_products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem('auto_service_products', JSON.stringify(INITIAL_PRODUCTS));
    }

    // Sales
    const savedSales = localStorage.getItem('auto_service_product_sales');
    if (savedSales) {
      setProductSales(JSON.parse(savedSales));
    } else {
      setProductSales(INITIAL_PRODUCT_SALES);
      localStorage.setItem('auto_service_product_sales', JSON.stringify(INITIAL_PRODUCT_SALES));
    }

    // Movements
    const savedMovements = localStorage.getItem('auto_service_inventory_movements');
    if (savedMovements) {
      setInventoryMovements(JSON.parse(savedMovements));
    } else {
      setInventoryMovements(INITIAL_INVENTORY_MOVEMENTS);
      localStorage.setItem('auto_service_inventory_movements', JSON.stringify(INITIAL_INVENTORY_MOVEMENTS));
    }

    // Closings
    const savedClosings = localStorage.getItem('auto_service_daily_closings');
    if (savedClosings) {
      setDailyClosings(JSON.parse(savedClosings));
    } else {
      setDailyClosings(INITIAL_DAILY_CLOSINGS);
      localStorage.setItem('auto_service_daily_closings', JSON.stringify(INITIAL_DAILY_CLOSINGS));
    }

    // Audit logs
    const savedAudits = localStorage.getItem('auto_service_audit_logs');
    if (savedAudits) {
      setAuditLogs(JSON.parse(savedAudits));
    } else {
      const initialLogs: AuditLog[] = [
        {
          id: 'audit-1',
          userId: 'usr-admin-1',
          userFullName: 'სისტემა',
          action: 'ინტეგრაცია',
          details: 'მაღაზიის/მარაგების ახალი მოდული წარმატებით აქტივირდა',
          createdAt: '2026-05-10T11:00:00Z'
        }
      ];
      setAuditLogs(initialLogs);
      localStorage.setItem('auto_service_audit_logs', JSON.stringify(initialLogs));
    }
  }, []);

  const operatorFullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'ოპერატორი';

  // --- PERSISTENCE WRAPER DISPATCHERS ---
  const updateProductsState = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem('auto_service_products', JSON.stringify(newProducts));
  };

  const updateProductSalesState = (newSales: ProductSale[]) => {
    setProductSales(newSales);
    localStorage.setItem('auto_service_product_sales', JSON.stringify(newSales));
  };

  const updateMovementsState = (newMoves: InventoryMovement[]) => {
    setInventoryMovements(newMoves);
    localStorage.setItem('auto_service_inventory_movements', JSON.stringify(newMoves));
  };

  const updateClosingsState = (newClosings: DailyClosing[]) => {
    setDailyClosings(newClosings);
    localStorage.setItem('auto_service_daily_closings', JSON.stringify(newClosings));
  };

  const addAuditLog = (op: string, detail: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      userId: currentUser?.id || 'usr-guest',
      userFullName: operatorFullName,
      action: op,
      details: detail,
      createdAt: new Date().toISOString()
    };
    const updated = [...auditLogs, newLog];
    setAuditLogs(updated);
    localStorage.setItem('auto_service_audit_logs', JSON.stringify(updated));
  };

  // --- ACTIONS HANDLERS ---

  // 1. ADD SALE (POS CHECKOUT COMPLETED)
  const handleAddSale = (salePayload: Omit<ProductSale, 'id' | 'createdAt'>) => {
    const newId = `psale-${Date.now()}`;
    const newSale: ProductSale = {
      ...salePayload,
      id: newId,
      createdAt: new Date().toISOString()
    };

    // Update sales list
    const nextSales = [newSale, ...productSales];
    updateProductSalesState(nextSales);

    // Stock adjustments + inventory movement registers
    const nextProducts = [...products];
    const newMovements = [...inventoryMovements];

    salePayload.items.forEach((item) => {
      const matchIdx = nextProducts.findIndex((p) => p.id === item.productId);
      if (matchIdx !== -1) {
        const prod = nextProducts[matchIdx];
        // reduce stock, increase soldQuantity
        nextProducts[matchIdx] = {
          ...prod,
          stock: Math.max(0, prod.stock - item.quantity),
          soldQuantity: prod.soldQuantity + item.quantity
        };

        // Write movement log
        newMovements.push({
          id: `m-${Date.now()}-${item.productId}`,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantity: -item.quantity, // negative representing deduction
          purchasePrice: item.purchasePrice,
          date: new Date().toISOString().split('T')[0],
          note: `გაყიდვა POS ჩეკით #${newId}`,
          operatorName: operatorFullName,
          createdAt: new Date().toISOString()
        });
      }
    });

    updateProductsState(nextProducts);
    updateMovementsState(newMovements);

    addAuditLog(
      'პროდუქტის გაყიდვა',
      `გაფორმდა ჩეკი #${newId} [კლიენტი: ${salePayload.clientName}] თანხა: ${salePayload.finalAmount}₾`
    );
  };

  // 2. ADD PRODUCT (NEW CATALOG CATALOG ITEM)
  const handleAddProduct = (prodPayload: Omit<Product, 'id' | 'soldQuantity' | 'createdAt'>) => {
    const newProd: Product = {
      ...prodPayload,
      id: `prod-${Date.now()}`,
      soldQuantity: 0,
      createdAt: new Date().toISOString()
    };

    updateProductsState([...products, newProd]);
    addAuditLog('კატალოგის დახვეწა', `დაემატა ახალი პროდუქტი ${newProd.name} (SKU: ${newProd.code})`);
  };

  // 3. EDIT PRODUCT (CATALOG DATA MODIFICATION)
  const handleEditProduct = (productId: string, partialPayload: Partial<Product>) => {
    const nextProducts = products.map((p) => {
      if (p.id === productId) {
        return { ...p, ...partialPayload };
      }
      return p;
    });

    updateProductsState(nextProducts);
    addAuditLog('პროდუქტის შეცვლა', `დარედაქტირდა პროდუქტი ID: ${productId}`);
  };

  // 4. DELETE PRODUCT FROM CATALOG
  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    const nextProducts = products.filter((p) => p.id !== productId);
    updateProductsState(nextProducts);
    addAuditLog('პროდუქტის წაშლა', `წაიშალა პროდუქტი ${target?.name || productId} კატალოგიდან`);
  };

  // 5. REFILL STOCK (WAREHOUSE UPDATE)
  const handleRefillStock = (productId: string, refillQty: number, refillPrice: number, refillNote: string) => {
    const nextProducts = [...products];
    const matchIdx = nextProducts.findIndex((p) => p.id === productId);

    if (matchIdx !== -1) {
      const prod = nextProducts[matchIdx];
      nextProducts[matchIdx] = {
        ...prod,
        stock: prod.stock + refillQty,
        purchasePrice: refillPrice // automatically updates base purchase price inside product
      };

      // Create refill movement logs
      const nextMovements = [
        {
          id: `m-${Date.now()}`,
          productId,
          productName: prod.name,
          type: 'refill' as const,
          quantity: refillQty,
          purchasePrice: refillPrice,
          date: new Date().toISOString().split('T')[0],
          note: refillNote,
          operatorName: operatorFullName,
          createdAt: new Date().toISOString()
        },
        ...inventoryMovements
      ];

      updateProductsState(nextProducts);
      updateMovementsState(nextMovements);

      addAuditLog(
        'მარაგების Refill',
        `შეივსო პროდუქტის [${prod.name}] მარაგი +${refillQty} ცალით. ერთეულის ფასი: ${refillPrice}₾`
      );
    }
  };

  // 6. CONFIRM DAILY CLOSING
  const handleConfirmCloseDay = (closingPayload: Omit<DailyClosing, 'id' | 'createdAt'>) => {
    const newClosing: DailyClosing = {
      ...closingPayload,
      id: `close-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    updateClosingsState([newClosing, ...dailyClosings]);
    addAuditLog('დღის დახურვა', `სამუშაო დღე ${closingPayload.date} წარმატებით დაიხურა და დაიბლოკა`);
  };

  // 7. UNDO DAILY CLOSING (SUPER ADMIN ONLY)
  const handleUndoClosing = (closingId: string) => {
    if (!currentUser || currentUser.role !== 'super_admin') return;

    const target = dailyClosings.find((c) => c.id === closingId);
    const nextClosings = dailyClosings.filter((c) => c.id !== closingId);

    updateClosingsState(nextClosings);
    addAuditLog('დახურვის გაუქმება', `სამუშაო დღის ${target?.date || closingId} დახურვა გაუქმდა სუპერ ადმინის მიერ`);
  };

  // 8. MARK UNPAID AS PAID LATER (DEBTS COLLECTION)
  const handleMarkAsPaid = (saleId: string, method: 'cash' | 'card' | 'tbc' | 'bog' | 'transfer') => {
    const nextSales = productSales.map((sale) => {
      if (sale.id === saleId) {
        return {
          ...sale,
          paymentStatus: 'paid' as const,
          paymentMethod: method,
          date: new Date().toISOString().split('T')[0] // updates the transaction date to the day it was actually paid, reflecting in today's closing!
        };
      }
      return sale;
    });

    updateProductSalesState(nextSales);
    addAuditLog('კრედიტის დაფარვა', `დაიფარა და განაღდდა კლიენტის ვალი ჩეკზე #${saleId} [მეთოდი: ${method.toUpperCase()}]`);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-2">
      {/* Module Title Banner & Navigations */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-1 font-sans uppercase">
            <AppWindow className="w-5 h-5 text-amber-500" />
            სავაჭრო სისტემა & მარაგების მართვა
          </h2>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            ავტონაწილების, სამუხრუჭე ხუნდების, ზეთებისა და ფილტრების POS სალარო ტერმინალი და საწყობის მართვის მოდული
          </p>
        </div>

        {/* Workspace tabs navigator */}
        <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl max-w-full overflow-x-auto scrollbar-none select-none">
          <button
            id="store-tab-pos"
            onClick={() => setActiveTab('pos')}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'pos' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            სალარო / POS
          </button>

          <button
            id="store-tab-inventory"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            პროდუქტები & მარაგი
          </button>

          <button
            id="store-tab-closing"
            onClick={() => setActiveTab('closing')}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'closing' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            დღის დახურვა
          </button>

          <button
            id="store-tab-debts"
            onClick={() => setActiveTab('debts')}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'debts' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            დავალიანება
          </button>

          <button
            id="store-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            ანგარიშები
          </button>
        </div>
      </div>

      {/* RENDER CHOSEN TAB WITH FADE-IN */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.15 }}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl min-h-[64vh]"
        >
          {activeTab === 'pos' && (
            <POSSection
              products={products}
              orders={orders}
              onAddSale={handleAddSale}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'products' && (
            <ProductsSection
              products={products}
              currentUser={currentUser as any}
              onAddProduct={handleAddProduct}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onRefillStock={handleRefillStock}
            />
          )}

          {activeTab === 'closing' && (
            <DayClosingSection
              orders={orders}
              services={services}
              productSales={productSales}
              dailyClosings={dailyClosings}
              currentUser={currentUser as any}
              onConfirmCloseDay={handleConfirmCloseDay}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsSection
              productSales={productSales}
              onMarkAsPaid={handleMarkAsPaid}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'analytics' && (
            <StoreAnalytics
              products={products}
              productSales={productSales}
              dailyClosings={dailyClosings}
              inventoryMovements={inventoryMovements}
              auditLogs={auditLogs}
              currentUser={currentUser as any}
              onUndoClosing={handleUndoClosing}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
