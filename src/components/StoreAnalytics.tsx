import React, { useState } from 'react';
import { Product, ProductSale, DailyClosing, InventoryMovement, Role } from '../types';
import { FileSpreadsheet, FileDown, TrendingUp, DollarSign, Calendar, BarChart3, Receipt, Tag, ArrowDownLeft, ArrowUpRight, ShieldAlert, Sparkles, Filter, Users } from 'lucide-react';

interface StoreAnalyticsProps {
  products: Product[];
  productSales: ProductSale[];
  dailyClosings: DailyClosing[];
  inventoryMovements: InventoryMovement[];
  auditLogs: any[];
  currentUser: { role: Role; firstName: string; lastName: string };
  onUndoClosing?: (closingId: string) => void;
}

export default function StoreAnalytics({
  products,
  productSales,
  dailyClosings,
  inventoryMovements,
  auditLogs,
  currentUser,
  onUndoClosing,
}: StoreAnalyticsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sales' | 'inventory' | 'closings' | 'audits'>('sales');

  // Filter histories query
  const [historySearch, setHistorySearch] = useState('');
  const [historyMethod, setHistoryMethod] = useState('all');
  const [historyPaid, setHistoryPaid] = useState('all');

  const isSuper = currentUser.role === 'super_admin';

  // --- STATISTICS CALCULATORS ---
  const paidSales = productSales.filter((s) => s.paymentStatus === 'paid');
  const unpaidSales = productSales.filter((s) => s.paymentStatus === 'unpaid');

  const totalSalesRevenue = productSales.reduce((sum, s) => sum + s.finalAmount, 0);
  const totalReceivedCashFlow = paidSales.reduce((sum, s) => sum + s.finalAmount, 0);
  const totalReceivablesValue = unpaidSales.reduce((sum, s) => sum + s.finalAmount, 0);

  // Total investment & profit margins
  let totalInvestmentCost = 0;
  let totalProjectedProfit = 0;
  products.forEach((p) => {
    totalInvestmentCost += p.purchasePrice * p.stock;
    totalProjectedProfit += (p.salePrice - p.purchasePrice) * p.stock;
  });

  // Calculate Best selling & Most Profitable
  const itemSalesMap: Record<string, { qty: number; profit: number; revenue: number }> = {};
  productSales.forEach((sale) => {
    sale.items.forEach((it) => {
      const existing = itemSalesMap[it.productName] || { qty: 0, profit: 0, revenue: 0 };
      const qtySold = it.quantity;
      const profitEarned = (it.salePrice - it.purchasePrice) * qtySold;
      const revProduced = it.salePrice * qtySold;

      itemSalesMap[it.productName] = {
        qty: existing.qty + qtySold,
        profit: existing.profit + profitEarned,
        revenue: existing.revenue + revProduced,
      };
    });
  });

  let bestSellerName = '---';
  let bestSellerQty = 0;
  let topProfitName = '---';
  let topProfitVal = 0;

  Object.entries(itemSalesMap).forEach(([name, data]) => {
    if (data.qty > bestSellerQty) {
      bestSellerQty = data.qty;
      bestSellerName = name;
    }
    if (data.profit > topProfitVal) {
      topProfitVal = data.profit;
      topProfitName = name;
    }
  });

  // --- CSV / EXCEL EXPORT HELPERS ---
  const handleExportProductsToCSV = () => {
    const headers = ['კოდი/SKU', 'სახელი', 'კატეგორია', 'ბრენდი', 'შესასყიდი ფასი', 'გასაყიდი ფასი', 'მარაგი', 'ერთეული', 'გაყიდული რაოდენობა', 'სტატუსი'];
    const rows = products.map((p) => [
      p.code,
      p.name,
      p.category,
      p.brand,
      p.purchasePrice,
      p.salePrice,
      p.stock,
      p.unit,
      p.soldQuantity,
      p.status,
    ]);

    triggerCSVDownload('products_catalog_report.csv', headers, rows);
  };

  const handleExportSalesToCSV = () => {
    const headers = ['ჩეკის ID', 'კლიენტი', 'ტელეფონი', 'მანქანა', 'ნომერი', 'თარიღი', 'ჯამი', 'ფასდაკლება', 'საბოლოო', 'გადახდა', 'ტიპი', 'ოპერატორი'];
    const rows = productSales.map((s) => [
      s.id,
      s.clientName,
      s.clientPhone || '---',
      s.carBrand || '---',
      s.carNumber || '---',
      s.date,
      s.totalAmount,
      s.discount,
      s.finalAmount,
      s.paymentStatus === 'paid' ? 'Paid' : 'Unpaid',
      s.paymentMethod,
      s.createdBy,
    ]);

    triggerCSVDownload('pos_sales_report.csv', headers, rows);
  };

  const handleExportClosingsToCSV = () => {
    const headers = ['თარიღი', 'დაწყება', 'დახურვა', 'მიღებული', 'უპოვარი', 'სერვისებიCount', 'სერვისებიRev', 'პროდუქტებიCount', 'პროდუქტებიRev', 'პროდუქტებიProfit', 'დახურა'];
    const rows = dailyClosings.map((c) => [
      c.date,
      c.startTime,
      c.closingTime,
      c.totalReceived,
      c.totalOutstanding,
      c.servicesCount,
      c.serviceRevenue,
      c.productSalesCount,
      c.productRevenue,
      c.productProfit,
      c.closedBy,
    ]);

    triggerCSVDownload('day_closings_history.csv', headers, rows);
  };

  const triggerCSVDownload = (filename: string, headers: string[], rows: any[][]) => {
    const bom = '\uFEFF'; // UTF-8 BOM representation for correct Georgian characters display in Excel
    const headerLine = headers.join(',');
    const contentLines = rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','));
    const csvContent = bom + [headerLine, ...contentLines].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
  };

  // --- FILTERS LOGIC ---
  const filteredSales = productSales.filter((s) => {
    const matchesSearch =
      s.clientName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (s.clientPhone && s.clientPhone.includes(historySearch)) ||
      (s.carNumber && s.carNumber.toLowerCase().includes(historySearch.toLowerCase()));

    const matchesMethod = historyMethod === 'all' || s.paymentMethod === historyMethod;
    const matchesPaid =
      historyPaid === 'all' ||
      (historyPaid === 'paid' && s.paymentStatus === 'paid') ||
      (historyPaid === 'unpaid' && s.paymentStatus === 'unpaid');

    return matchesSearch && matchesMethod && matchesPaid;
  });

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow select-none">
          <span className="text-[9px] text-slate-500 uppercase block font-extrabold pb-0.5">სულ გაყიდვების ორდერები</span>
          <span className="text-sm font-black text-slate-100 font-mono block">
            {totalSalesRevenue.toLocaleString()} ₾
          </span>
          <p className="text-[8.5px] text-slate-450 mt-1">
            ნაღდი ბრუნვა: <b className="text-emerald-400 font-mono">{totalReceivedCashFlow.toLocaleString()} ₾</b>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow select-none">
          <span className="text-[9px] text-slate-500 uppercase block font-extrabold pb-0.5">საწყობის მიმდინარე მარაგი</span>
          <span className="text-sm font-black text-slate-100 font-mono block">
            {totalInvestmentCost.toLocaleString()} ₾
          </span>
          <p className="text-[8.5px] text-slate-450 mt-1">
            აქტივი საწყობში (შესყიდვის ფასით)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow select-none">
          <span className="text-[9px] text-slate-505 uppercase block font-extrabold pb-0.5">Best Seller პროდუქტი</span>
          <span className="text-xs font-black text-amber-500 truncate block mt-0.5" title={bestSellerName}>
            {bestSellerName}
          </span>
          <p className="text-[8.5px] text-slate-400 mt-1">
            გაყიდულია: <b className="text-slate-100 font-mono">{bestSellerQty} ერთეული</b>
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl shadow select-none">
          <span className="text-[9px] text-slate-505 uppercase block font-extrabold pb-0.5">მოსალოდნელი მარჟა საწყობიდან</span>
          <span className="text-sm font-black text-indigo-400 font-mono block">
            +{totalProjectedProfit.toLocaleString()} ₾
          </span>
          <p className="text-[8.5px] text-slate-400 mt-1">
            დარჩენილი ნივთების სრული გაყიდვისას
          </p>
        </div>
      </div>

      {/* CSV Export Bar Container */}
      <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl shadow flex flex-col sm:flex-row gap-3 items-center justify-between select-none">
        <div className="flex items-center gap-1.5 font-bold text-slate-350">
          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
          <span>ფინანსური რეპორტების ექსპორტი (Excel / CSV თავსებადი ფორმატი):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="export-products-csv-btn"
            onClick={handleExportProductsToCSV}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" /> ნივთების კატალოგი
          </button>
          <button
            id="export-sales-csv-btn"
            onClick={handleExportSalesToCSV}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" /> გაყიდვების რეპორტები
          </button>
          <button
            id="export-closings-csv-btn"
            onClick={handleExportClosingsToCSV}
            className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" /> დახურვების არქივი
          </button>
        </div>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-800 select-none">
        <button
          onClick={() => setActiveSubTab('sales')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeSubTab === 'sales'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          📄 გაყიდვების ისტორია
        </button>
        <button
          id="tab-history-movements"
          onClick={() => setActiveSubTab('inventory')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeSubTab === 'inventory'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          🔄 მარაგების მოძრაობები
        </button>
        <button
          id="tab-history-closings"
          onClick={() => setActiveSubTab('closings')}
          className={`py-2 px-4 font-bold border-b-2 transition ${
            activeSubTab === 'closings'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          🔒 დღის დახურვის ისტორია
        </button>
        <button
          id="tab-history-audits"
          onClick={() => setActiveSubTab('audits')}
          className={`py-2 px-4 font-bold border-b-2 transition relative ${
            activeSubTab === 'audits'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-450 hover:text-slate-200'
          }`}
        >
          🛡️ სისტემური ლოგები
          <span className="ml-1.5 bg-red-500/10 text-red-500 text-[8px] font-black px-1 py-0.5 rounded border border-red-500/20">
            Audit
          </span>
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB PANEL */}
      {activeSubTab === 'sales' && (
        <div className="space-y-3">
          {/* Sales local filter form */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <input
              id="history-filter-search"
              type="text"
              placeholder="ფილტრი კლიენტის სახელით, ნომრით..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200"
            />
            <select
              value={historyMethod}
              onChange={(e) => setHistoryMethod(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-350"
            >
              <option value="all">💳 ყველა მეთოდი</option>
              <option value="cash">💵 ნაღდი ფული</option>
              <option value="card">💳 ბარათი</option>
              <option value="tbc">🏦 TBC ბანკი</option>
              <option value="bog">🏦 BOG ბანკი</option>
              <option value="transfer">📇 გადარიცხვა</option>
              <option value="mixed">🔀 შერეული</option>
            </select>
            <select
              value={historyPaid}
              onChange={(e) => setHistoryPaid(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-350"
            >
              <option value="all">📊 ყველა სტატუსი</option>
              <option value="paid">🟢 მხოლოდ განაღდებული</option>
              <option value="unpaid">🔴 მხოლოდ დავალიანებები</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-500 text-[9px] uppercase font-bold">
                  <th className="p-2.5">თარიღი/საათი</th>
                  <th className="p-2.5">კლიენტი</th>
                  <th className="p-2.5">პროდუქტები</th>
                  <th className="p-2.5 text-center">მეთოდი</th>
                  <th className="p-2.5 text-center">სტატუსი</th>
                  <th className="p-2.5 text-right">ჯამი</th>
                  <th className="p-2.5 text-center">ოპერატორი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-955/40 text-[11.5px]">
                    <td className="p-2.5 font-mono text-slate-400">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleString('ka-GE', { hour12: false }) : sale.date}
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-200">{sale.clientName}</div>
                      {sale.carBrand && <div className="text-[9.5px] text-slate-500">{sale.carBrand} [{sale.carNumber}]</div>}
                    </td>
                    <td className="p-2.5 font-sans">
                      {sale.items.map((it, i) => (
                        <div key={i} className="text-[10px] text-slate-400">
                          {it.productName} ({it.quantity}{' '}
                          <span className="text-[8.5px] text-slate-500">ცალი</span>)
                        </div>
                      ))}
                    </td>
                    <td className="p-2.5 text-center uppercase text-[10px] font-mono font-bold text-indigo-400">
                      {sale.paymentMethod}
                    </td>
                    <td className="p-2.5 text-center">
                      <span
                        className={`px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded ${
                          sale.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {sale.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-black font-mono text-slate-100">
                      {sale.finalAmount.toLocaleString()} ₾
                    </td>
                    <td className="p-2.5 text-center font-bold text-slate-450">
                      {sale.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'inventory' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-500 text-[9px] uppercase font-bold">
                  <th className="p-2.5">დრო</th>
                  <th className="p-2.5">პროდუქტი</th>
                  <th className="p-2.5 text-center">მოძრაობა</th>
                  <th className="p-2.5 text-right">რაოდენობა</th>
                  <th className="p-2.5 text-right">ერთეულის ფასი</th>
                  <th className="p-2.5">შენიშვნა</th>
                  <th className="p-2.5 text-center">ოპერატორი</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {inventoryMovements.map((move) => {
                  const isRefill = move.type === 'refill';
                  return (
                    <tr key={move.id} className="hover:bg-slate-955/40 text-[11.5px]">
                      <td className="p-2.5 font-mono text-slate-400">
                        {move.createdAt ? new Date(move.createdAt).toLocaleString('ka-GE', { hour12: false }) : move.date}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-200">{move.productName}</td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase rounded-md ${
                            isRefill
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {isRefill ? 'მარაგების Refill' : 'გაყიდვა POS ჩეკით'}
                        </span>
                      </td>
                      <td className={`p-2.5 text-right font-black font-mono ${isRefill ? 'text-cyan-400' : 'text-slate-100'}`}>
                        {isRefill ? `+${move.quantity}` : move.quantity}
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-350">
                        {move.purchasePrice.toLocaleString()} ₾
                      </td>
                      <td className="p-2.5 text-slate-450 italic max-w-xs truncate">{move.note}</td>
                      <td className="p-2.5 text-center font-bold text-slate-450">{move.operatorName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'closings' && (
        <div className="space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-500 text-[9px] uppercase font-bold">
                  <th className="p-2.5">დახურვის თარიღი/საათი</th>
                  <th className="p-2.5 text-right">მიღებული ნავაჭრი</th>
                  <th className="p-2.5 text-right">სერვისები</th>
                  <th className="p-2.5 text-right">პროდუქტები</th>
                  <th className="p-2.5 text-right">პროდუქტის მოგება</th>
                  <th className="p-2.5">შენიშვნა</th>
                  <th className="p-2.5 text-center">დამხურავი</th>
                  {isSuper && <th className="p-2.5 text-right">დაცვა</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {dailyClosings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-955/40 text-[11.5px]">
                    <td className="p-2.5 font-bold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{c.date}</span>
                        <span className="text-[10px] text-slate-500 font-mono font-normal">({c.startTime}-{c.closingTime})</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-right font-black font-mono text-emerald-400">
                      +{c.totalReceived.toLocaleString()} ₾
                    </td>
                    <td className="p-2.5 text-right font-mono text-indigo-300">
                      {c.serviceRevenue.toLocaleString()} ₾ ({c.servicesCount}ც)
                    </td>
                    <td className="p-2.5 text-right font-mono text-amber-500">
                      {c.productRevenue.toLocaleString()} ₾ ({c.productSalesCount}ც)
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-500 font-bold">
                      +{c.productProfit.toLocaleString()} ₾
                    </td>
                    <td className="p-2.5 text-slate-450 italic max-w-xs truncate">{c.note}</td>
                    <td className="p-2.5 text-center font-bold text-slate-450">{c.closedBy}</td>
                    {isSuper && (
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => {
                            if (confirm('ნამდვილად გსურთ ამ დღის მოხსნა დახურული არქივიდან და კორექტირება? (ეს დააბრუნებს დღეს აქტიურ რეჟიმში)')) {
                              onUndoClosing?.(c.id);
                            }
                          }}
                          className="py-0.5 px-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded text-[9.5px] font-bold cursor-pointer transition"
                        >
                          განბლოკვა
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'audits' && (
        <div className="space-y-3">
          <div className="p-3 bg-red-950/10 border border-red-500/10 text-red-405 rounded-lg text-[10.5px] flex items-center gap-2 select-none">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>სუპერ ადმინისტრატორის კონტროლის დაფა. ნებისმიერი ფასის მოდიფიკაცია, საწყობის მარაგების კორექტირება ან დახურვის რედაქტირება იწერება უსაფრთხოდ აუდიტის ლოგებში.</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="text-center py-8 text-slate-500">კატალოგის და საწყობის ცვლილებების ლოგები სუფთაა</p>
            ) : (
              <table className="w-full text-left font-sans text-[11px]">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-850 text-slate-500 text-[9px] uppercase font-bold">
                    <th className="p-2.5">თარიღი/საათი</th>
                    <th className="p-2.5">მომხმარებელი</th>
                    <th className="p-2.5">ქმედება / ოპერაცია</th>
                    <th className="p-2.5">დეტალები</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {auditLogs.slice().reverse().map((log) => (
                    <tr key={log.id} className="hover:bg-slate-955/40">
                      <td className="p-2.5 font-mono text-slate-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('ka-GE', { hour12: false }) : ''}
                      </td>
                      <td className="p-2.5 font-bold text-slate-300">{log.userFullName}</td>
                      <td className="p-2.5 font-sans font-semibold text-amber-500">{log.action}</td>
                      <td className="p-2.5 text-slate-400 font-mono max-w-sm truncate">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
