import * as XLSX from 'xlsx';
import {
  User, CarServiceOrder, ServiceItem, Product, ProductSale, DailyClosing,
  ServiceTypeConfig, ROLE_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../types';

export interface ExportData {
  users: User[];
  orders: CarServiceOrder[];
  services: ServiceItem[];
  products: Product[];
  productSales: ProductSale[];
  dailyClosings: DailyClosing[];
  serviceConfigs: ServiceTypeConfig[];
}

type Row = Record<string, string | number>;

/** Append a worksheet built from an array of objects, auto-sizing columns. */
function addSheet(wb: XLSX.WorkBook, name: string, rows: Row[]) {
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ ' ': 'ცარიელია' }]);
  // Rough column auto-width based on the longest cell in each column
  if (rows.length) {
    const keys = Object.keys(rows[0]);
    ws['!cols'] = keys.map(k => {
      const maxLen = Math.max(
        k.length,
        ...rows.map(r => String(r[k] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 8), 50) };
    });
  }
  // Sheet names max 31 chars, no special chars
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

export function exportAllToExcel(data: ExportData) {
  const { users, orders, services, products, productSales, dailyClosings, serviceConfigs } = data;

  const userName = (id?: string) => {
    if (!id) return '';
    const u = users.find(x => x.id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() : id;
  };
  const svcLabel = (id: string) => serviceConfigs.find(c => c.id === id)?.name || id;
  const orderOf = (orderId: string) => orders.find(o => o.id === orderId);

  const wb = XLSX.utils.book_new();

  // ── Orders ───────────────────────────────────────────
  addSheet(wb, 'დავალებები', orders.map(o => ({
    'თარიღი': o.date,
    'მარკა / მოდელი': o.carBrand,
    'ნომერი': o.carNumber,
    'კლიენტი': o.clientFullName,
    'ტელეფონი': o.clientPhone,
    'პრობლემა': o.problemDescription,
    'სტატუსი': ORDER_STATUS_LABELS[o.status],
    'გადახდა': PAYMENT_STATUS_LABELS[o.paymentStatus],
    'ვისთან გადაიხადა': o.paidTo || '',
    'დაამატა': userName(o.createdBy),
    'მინიჭებული': (o.assignedEmployeeIds || []).map(userName).join(', '),
  })));

  // ── Services ─────────────────────────────────────────
  addSheet(wb, 'მომსახურებები', services.map(s => {
    const o = orderOf(s.orderId);
    return {
      'თარიღი': o?.date || '',
      'მარკა': o?.carBrand || '',
      'ნომერი': o?.carNumber || '',
      'მომსახურება': svcLabel(s.serviceType),
      'აღწერა': s.description,
      'ფასი (₾)': s.price,
      'შემსრულებელი': userName(s.mechanicId),
      'ანაზღაურება (₾)': s.mechanicEarning,
      'მე-2 შემსრ.': userName(s.coMechanicId),
      'მე-2 ანაზღ. (₾)': s.coMechanicEarning ?? '',
    };
  }));

  // ── Products ─────────────────────────────────────────
  addSheet(wb, 'პროდუქტები', products.map(p => ({
    'კოდი': p.code,
    'დასახელება': p.name,
    'კატეგორია': p.category,
    'ბრენდი': p.brand,
    'ერთეული': p.unit,
    'შესყიდვის ფასი': p.purchasePrice,
    'გასაყიდი ფასი': p.salePrice,
    'მარაგი': p.stock,
    'მინ. მარაგი': p.minStock,
    'გაყიდული': p.soldQuantity,
    'სტატუსი': p.status === 'active' ? 'აქტიური' : 'არააქტიური',
  })));

  // ── Product sales ────────────────────────────────────
  addSheet(wb, 'გაყიდვები', productSales.map(s => ({
    'თარიღი': s.date,
    'კლიენტი': s.clientName,
    'ტელეფონი': s.clientPhone,
    'მანქანა': s.carBrand,
    'ნომერი': s.carNumber,
    'პროდუქტები': s.items.map(i => `${i.productName} x${i.quantity}`).join('; '),
    'ჯამი (₾)': s.totalAmount,
    'ფასდაკლება (₾)': s.discount,
    'საბოლოო (₾)': s.finalAmount,
    'გადახდა': PAYMENT_STATUS_LABELS[s.paymentStatus],
    'მეთოდი': s.paymentMethod,
    'გამყიდველი': userName(s.createdBy),
  })));

  // ── Daily closings ───────────────────────────────────
  addSheet(wb, 'დღის დახურვები', dailyClosings.map(c => ({
    'თარიღი': c.date,
    'მიღებული (₾)': c.totalReceived,
    'დარჩენილი (₾)': c.totalOutstanding,
    'მომსახ. შემოს. (₾)': c.serviceRevenue,
    'პროდ. შემოს. (₾)': c.productRevenue,
    'პროდ. მოგება (₾)': c.productProfit,
    'ნაღდი': c.totalCash,
    'ბარათი': c.totalCard,
    'TBC': c.totalTbc,
    'BOG': c.totalBog,
    'გადარიცხვა': c.totalTransfer,
    'დახურა': userName(c.closedBy),
    'შენიშვნა': c.note,
  })));

  // ── Personnel ────────────────────────────────────────
  addSheet(wb, 'პერსონალი', users
    .filter(u => u.username !== 'imedo')
    .map(u => ({
      'სახელი': u.firstName,
      'გვარი': u.lastName,
      'იუზერნეიმი': u.username,
      'როლი': ROLE_LABELS[u.role] || u.role,
      'მოდულები': (u.enabledModules || []).join(', '),
    })));

  // ── Earnings summary (per executor) ──────────────────
  const earningsMap: Record<string, number> = {};
  services.forEach(s => {
    earningsMap[s.mechanicId] = (earningsMap[s.mechanicId] || 0) + s.mechanicEarning;
    if (s.coMechanicId) earningsMap[s.coMechanicId] = (earningsMap[s.coMechanicId] || 0) + (s.coMechanicEarning || 0);
  });
  addSheet(wb, 'ხელფასები', Object.entries(earningsMap)
    .filter(([id]) => userName(id) && users.find(u => u.id === id)?.username !== 'imedo')
    .map(([id, total]) => ({
      'თანამშრომელი': userName(id),
      'როლი': ROLE_LABELS[users.find(u => u.id === id)?.role || 'mechanic'] || '',
      'ჯამური ანაზღაურება (₾)': Number(total.toFixed(2)),
    }))
    .sort((a, b) => (b['ჯამური ანაზღაურება (₾)'] as number) - (a['ჯამური ანაზღაურება (₾)'] as number)));

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `NewAutoMotors_export_${stamp}.xlsx`);
}
