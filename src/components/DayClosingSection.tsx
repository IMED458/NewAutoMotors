import React, { useState } from 'react';
import { ProductSale, CarServiceOrder, DailyClosing, Role, ServiceItem } from '../types';
import { Lock, FileSpreadsheet, FileText, Calendar, Clock, AlertCircle, CheckCircle2, DollarSign, BarChart3, TrendingUp, Printer, Check, ShoppingBag, Wrench, ShieldAlert } from 'lucide-react';

interface DayClosingSectionProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  productSales: ProductSale[];
  dailyClosings: DailyClosing[];
  currentUser: { role: Role; firstName: string; lastName: string };
  onConfirmCloseDay: (closing: Omit<DailyClosing, 'id' | 'createdAt'>) => void;
}

export default function DayClosingSection({
  orders,
  services,
  productSales,
  dailyClosings,
  currentUser,
  onConfirmCloseDay,
}: DayClosingSectionProps) {
  const [closingNote, setClosingNote] = useState('დღიური ფინანსური ნაშთი ემთხვევა სალაროს. ხარვეზები არ დაფიქსირებულა.');
  const [lastClosedReport, setLastClosedReport] = useState<DailyClosing | null>(null);
  const [archiveDate, setArchiveDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const isSuper = currentUser.role === 'super_admin';
  const canBrowseArchive = ['accountant', 'super_admin', 'general_manager', 'developer'].includes(currentUser.role);

  // 1. Calculate Today's Services Revenue (from completed orders TODAY and their respective service items)
  const todayOrders = orders.filter((o) => o.date === todayStr);
  const todayServicesDoneCount = todayOrders.length;
  
  const todayServicesRevenue = todayOrders.reduce((sum, o) => {
    if (o.paymentStatus === 'paid') {
      const orderServices = services.filter((s) => s.orderId === o.id);
      return sum + orderServices.reduce((sSum, s) => sSum + s.price, 0);
    }
    return sum;
  }, 0);

  const todayServicesUnpaid = todayOrders.reduce((sum, o) => {
    if (o.paymentStatus === 'unpaid') {
      const orderServices = services.filter((s) => s.orderId === o.id);
      return sum + orderServices.reduce((sSum, s) => sSum + s.price, 0);
    }
    return sum;
  }, 0);

  // 2. Calculate Today's Product Sales
  const todayProductSales = productSales.filter((s) => s.date === todayStr);
  const todayProductSalesCount = todayProductSales.length;

  const todayProductsPaidRevenue = todayProductSales.reduce((sum, s) => {
    if (s.paymentStatus === 'paid') {
      return sum + s.finalAmount;
    }
    return sum;
  }, 0);

  const todayProductsUnpaidRevenue = todayProductSales.reduce((sum, s) => {
    if (s.paymentStatus === 'unpaid') {
      return sum + s.finalAmount;
    }
    return sum;
  }, 0);

  // Potential Product Profit calculations
  let todayProductsProfit = 0;
  todayProductSales.forEach((sale) => {
    sale.items.forEach((it) => {
      const cost = it.purchasePrice * it.quantity;
      const rcv = it.salePrice * it.quantity;
      todayProductsProfit += (rcv - cost);
    });
  });

  const todayProductsTotalDiscounts = todayProductSales.reduce((sum, s) => sum + s.discount, 0);
  todayProductsProfit = Math.max(0, todayProductsProfit - todayProductsTotalDiscounts);

  // 3. Payment Methods Breakdowns - COMBINED (Services + Products)
  let cashReceived = 0;
  let cardReceived = 0;
  let tbcReceived = 0;
  let bogReceived = 0;
  let transferReceived = 0;

  // Add from paid service orders using the method recorded on the order.
  todayOrders.forEach((o) => {
    if (o.paymentStatus === 'paid') {
      const orderServices = services.filter((s) => s.orderId === o.id);
      const total = orderServices.reduce((sSum, s) => sSum + s.price, 0);
      const method = o.paymentMethod || 'cash';
      if (method === 'cash') cashReceived += total;
      else if (method === 'card') cardReceived += total;
      else if (method === 'tbc') tbcReceived += total;
      else if (method === 'bog') bogReceived += total;
      else if (method === 'transfer') transferReceived += total;
    }
  });

  // Add from Paid Product Sales
  todayProductSales.forEach((s) => {
    if (s.paymentStatus === 'paid') {
      const pay = s.paymentMethod;
      if (pay === 'cash') cashReceived += s.finalAmount;
      else if (pay === 'card') cardReceived += s.finalAmount;
      else if (pay === 'tbc') tbcReceived += s.finalAmount;
      else if (pay === 'bog') bogReceived += s.finalAmount;
      else if (pay === 'transfer') transferReceived += s.finalAmount;
      else if (pay === 'mixed' && s.mixedPaymentDetails) {
        cashReceived += s.mixedPaymentDetails.cash || 0;
        cardReceived += s.mixedPaymentDetails.card || 0;
        tbcReceived += s.mixedPaymentDetails.tbc || 0;
        bogReceived += s.mixedPaymentDetails.bog || 0;
        transferReceived += s.mixedPaymentDetails.transfer || 0;
      }
    }
  });

  const grandTotalReceivedToday = cashReceived + cardReceived + tbcReceived + bogReceived + transferReceived;
  const grandTotalUnpaidToday = todayServicesUnpaid + todayProductsUnpaidRevenue;

  const isAlreadyClosed = dailyClosings.some((c) => c.date === todayStr);
  const activeClosingInfo = dailyClosings.find((c) => c.date === todayStr);

  const handleCloseDayFinal = () => {
    if (isAlreadyClosed) return;

    // List of sold products
    const itemsSold: { name: string; quantity: number; amount: number }[] = [];
    todayProductSales.forEach((sale) => {
      sale.items.forEach((it) => {
        const existing = itemsSold.find((x) => x.name === it.productName);
        if (existing) {
          existing.quantity += it.quantity;
          existing.amount += it.salePrice * it.quantity;
        } else {
          itemsSold.push({
            name: it.productName,
            quantity: it.quantity,
            amount: it.salePrice * it.quantity,
          });
        }
      });
    });

    // List of completed services
    const servicesDone = todayOrders.flatMap((o) => {
      const orderServices = services.filter((s) => s.orderId === o.id);
      return orderServices.map((s) => ({
        description: `${s.serviceType} (${o.carBrand})`,
        price: s.price,
      }));
    });

    const closingPayload = {
      date: todayStr,
      startTime: '09:00',
      closingTime: new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' }),
      totalReceived: grandTotalReceivedToday,
      totalOutstanding: grandTotalUnpaidToday,
      productSalesCount: todayProductSalesCount,
      servicesCount: todayServicesDoneCount,
      productRevenue: todayProductsPaidRevenue,
      serviceRevenue: todayServicesRevenue,
      productProfit: todayProductsProfit,
      totalCash: cashReceived,
      totalCard: cardReceived,
      totalTbc: tbcReceived,
      totalBog: bogReceived,
      totalTransfer: transferReceived,
      itemsSold,
      servicesDone,
      closedBy: `${currentUser.firstName} ${currentUser.lastName}`,
      note: closingNote.trim(),
    };

    onConfirmCloseDay(closingPayload);
    setLastClosedReport(closingPayload as DailyClosing);
  };

  return (
    <div className="space-y-4 font-sans text-xs">
      {/* Upper Alerts */}
      {isAlreadyClosed ? (
        <div className="p-3 bg-emerald-950/25 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="font-sans font-bold text-[12px]">სამუშაო დღე წარმატებით დახურულია!</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              დღევანდელი სეზონის ყველა ფინანსური მონაცემი, ტრანზაქცია და ჩეკი დაარქივდა. ცვლილებები შეზღუდულია.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-amber-950/25 border border-amber-500/20 text-amber-400 rounded-xl flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <h4 className="font-sans font-bold text-[12px]">მიმდინარეობს აქტიური დღის აღრიცხვა</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              დღიურ ანგარიშში აისახება რეალურ დროში გაყიდული ნებისმიერი პროდუქტი ან შესრულებული მანქანის სერვისი.
            </p>
          </div>
        </div>
      )}

      {canBrowseArchive && dailyClosings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-end print:hidden">
          <div className="flex-1">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">არქივიდან დღის დახურვის ნახვა</label>
            <select value={archiveDate} onChange={e => setArchiveDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200">
              <option value="">— აირჩიეთ თარიღი —</option>
              {[...dailyClosings].sort((a, b) => b.date.localeCompare(a.date)).map(closing => <option key={closing.id} value={closing.id}>{closing.date} · {closing.totalReceived.toLocaleString()} ₾</option>)}
            </select>
          </div>
          <button disabled={!archiveDate} onClick={() => { const report = dailyClosings.find(c => c.id === archiveDate); if (report) setLastClosedReport(report); }} className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-black text-xs disabled:opacity-40">ნახვა / ბეჭდვა</button>
        </div>
      )}

      {/* Grid of separate service and product blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BLOCK 1: SERVICES FINANCIALS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-850">
            <div className="bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20 text-indigo-400">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-200">სერვისების ბლოკი (ავტოდიაგნოსტიკა / ხელოსანი)</h3>
              <p className="text-[9.5px] text-slate-500">მანქანის სერვისებისა და ხელობის ხელფასების ბლოკი</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 select-none">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block">შესრულებული სერვისები:</span>
              <span className="text-base font-black font-mono text-indigo-400">{todayServicesDoneCount} შეკვეთა</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-505 block">მომსახურების მიღებული შემოსავალი:</span>
              <span className="text-base font-black font-mono text-emerald-400">+{todayServicesRevenue.toLocaleString()} ₾</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/40 rounded-lg border border-slate-850 flex justify-between text-[11px] text-slate-400">
            <span>სერვისების გაუფორმებელი/გადაუხდელი დავალიანება:</span>
            <span className="font-mono text-rose-400 font-bold">{todayServicesUnpaid.toLocaleString()} ₾</span>
          </div>
        </div>

        {/* BLOCK 2: PRODUCTS FINANCIALS */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center gap-1.5 pb-2.5 border-b border-slate-850">
            <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 text-amber-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-200">მაღაზიის/მარაგების ფინანსური ბლოკი</h3>
              <p className="text-[9.5px] text-slate-505">პროდუქტების, სათადარიგო ნაწილებისა და ზეთების ბლოკი</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 select-none">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 block">გაყიდული ნივთები:</span>
              <span className="text-base font-black font-mono text-amber-500">{todayProductSalesCount} ტრანზაქცია</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-505 block">მიღებული თანხა (მხოლოდ გადახდილი):</span>
              <span className="text-base font-black font-mono text-emerald-400">+{todayProductsPaidRevenue.toLocaleString()} ₾</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10.5px] bg-slate-950/40 p-2 rounded-lg border border-slate-850 text-slate-450">
            <div>პროდუქტის წმინდა მოგება: <b className="text-emerald-400 font-mono text-[11.5px] font-black">+{todayProductsProfit.toLocaleString()} ₾</b></div>
            <div className="text-right">გადაუხდელი ნაწილები: <b className="text-rose-400 font-mono font-bold">{todayProductsUnpaidRevenue.toLocaleString()} ₾</b></div>
          </div>
        </div>
      </div>

      {/* PAYMENT METHODS COMBINED BREAKDOWNS CHIPS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-200 pb-2 border-b border-slate-850 flex justify-between">
          <span>მთლიანი დღიური შემოსავალი გადახდის ტიპების მიხედვით (მიღებული სალაროში)</span>
          <span className="font-mono text-emerald-400 font-black">ჯამში: {grandTotalReceivedToday.toLocaleString()} ₾</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center select-none font-mono">
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg">
            <span className="text-[9px] text-slate-500 block font-sans">💵 ნაღდი ფული</span>
            <span className="text-xs font-black text-slate-200">{cashReceived.toLocaleString()} ₾</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg">
            <span className="text-[9px] text-slate-500 block font-sans">💳 ბარათი</span>
            <span className="text-xs font-black text-slate-200">{cardReceived.toLocaleString()} ₾</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg">
            <span className="text-[9px] text-slate-500 block font-sans">🏦 TBC ბანკი</span>
            <span className="text-xs font-black text-slate-200">{tbcReceived.toLocaleString()} ₾</span>
          </div>
          <div className="bg-slate-950 border border-slate-850 p-2 rounded-lg">
            <span className="text-[9px] text-slate-500 block font-sans">🏦 BOG ბანკი</span>
            <span className="text-xs font-black text-slate-200">{bogReceived.toLocaleString()} ₾</span>
          </div>
          <div className="bg-slate-950 border border-slate-550/20 p-2 rounded-lg bg-indigo-950/10">
            <span className="text-[9px] text-indigo-400 block font-sans">📇 გადარიცხვა</span>
            <span className="text-xs font-black text-indigo-400">{transferReceived.toLocaleString()} ₾</span>
          </div>
        </div>

        <div className="flex justify-between text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/60 font-sans">
          <span>ჯამური მოსალოდნელი კრედიტორული დავალიანება (დღეს წარმოქმნილი ვალი):</span>
          <span className="font-mono text-rose-400 font-black">{grandTotalUnpaidToday.toLocaleString()} ₾</span>
        </div>
      </div>

      {/* TODAY CLOSING SUBMIT FORM OR CLOSED DETAILS */}
      {isAlreadyClosed ? (
        <div className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl space-y-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850 text-emerald-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-black uppercase">გატარებული დახურვის ანგარიში ({todayStr})</span>
          </div>

          <div className="space-y-2 text-slate-350">
            <div className="grid grid-cols-2 gap-3 font-mono text-slate-400 text-[11px]">
              <div>სამუშაო საათები: <b className="text-slate-100">{activeClosingInfo?.startTime || '09:00'} - {activeClosingInfo?.closingTime || '20:00'}</b></div>
              <div>დამხურავი: <b className="text-slate-100">{activeClosingInfo?.closedBy}</b></div>
              <div>მიღებული ნავაჭრი: <b className="text-emerald-400">+{activeClosingInfo?.totalReceived.toLocaleString()} ₾</b></div>
              <div>კრედიტის მარაგი: <b className="text-rose-400">{activeClosingInfo?.totalOutstanding.toLocaleString()} ₾</b></div>
            </div>

            {activeClosingInfo?.note && (
              <p className="p-2.5 bg-slate-950 rounded-lg text-slate-400 border border-slate-850 italic">
                შენიშვნა: "{activeClosingInfo.note}"
              </p>
            )}

            {/* Warn locks if standard user */}
            {!isSuper && (
              <div className="p-2 bg-red-950/10 border border-red-500/10 text-red-400 rounded-lg text-[10px] flex items-center gap-1.5 font-sans leading-relaxed select-none">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>არქივი ჩაკეტილია. ცვლილებების ან რედაქტირების განხორციელება შეუძლია მხოლოდ <b>სუპერ ადმინისტრატორს</b>.</span>
              </div>
            )}
          </div>

          {/* Quick printer template of day summaries closing */}
          <div className="pt-2 select-none">
            <button
              onClick={() => {
                setLastClosedReport(activeClosingInfo as DailyClosing);
                setTimeout(() => window.print(), 100);
              }}
              className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> სრულად ბეჭდვა / PDF ექსპორტი
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850 text-amber-500">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-black uppercase">დღის დახურვის პროცედურა</span>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              დახურვის გაშვება დააფიქსირებს ყველა დღევანდელ ფინანსურ მონაცემს. გთხოვთ, ჩაწეროთ წიგნის ჩანაწერი ან ნებისმიერი კომენტარი, რომელიც დაარქივდება.
            </p>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-slate-500">ოპერატორის შენიშვნა დღის ბოლოს</label>
              <input
                id="closing-note-input"
                type="text"
                placeholder="ჩაწერეთ შენიშვნები..."
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2">
              <button
                id="close-working-day-btn"
                onClick={handleCloseDayFinal}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-sans font-extrabold uppercase text-[11px] rounded-lg tracking-wider flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/10 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4 font-black" /> სამუშაო დღის დახურვა & არქივირება
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED DRILLDOWN POPUP RECEIPT FOR LAST CLOSED */}
      {lastClosedReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div id="print-day-closing" className="bg-white text-slate-950 border border-slate-300 w-full max-w-sm rounded-xl p-5 shadow-2xl relative select-text print:max-w-none print:rounded-none print:border-0">
            <div className="text-center space-y-1">
              <Printer className="w-7 h-7 text-indigo-500 mx-auto" />
              <h3 className="text-sm font-black led-none uppercase tracking-widest font-mono">დღიური ფინანსური დახურვა</h3>
              <p className="text-[10px] text-slate-500 font-mono">თარიღი: {lastClosedReport.date}</p>
              <p className="text-[9px] text-slate-400 font-mono">საათები: {lastClosedReport.startTime} - {lastClosedReport.closingTime}</p>
              <p className="text-[9px] text-slate-400 font-mono">მოლარე: {lastClosedReport.closedBy}</p>
            </div>

            <div className="border-b border-dashed border-slate-300 my-4" />

            <div className="space-y-1.5 text-xs text-slate-800">
              <p className="flex justify-between font-bold">
                <span>სულ მიღებული თანხა:</span>
                <span className="font-mono">{lastClosedReport.totalReceived.toLocaleString()} ₾</span>
              </p>
              <p className="flex justify-between text-slate-600">
                <span>• მომსახურებით (სერვისი):</span>
                <span className="font-mono">+{lastClosedReport.serviceRevenue.toLocaleString()} ₾</span>
              </p>
              <p className="flex justify-between text-slate-600">
                <span>• მაღაზიიდან (პროდუქტები):</span>
                <span className="font-mono">+{lastClosedReport.productRevenue.toLocaleString()} ₾</span>
              </p>
              <p className="flex justify-between text-emerald-600 font-bold">
                <span>• მაღაზიის წმინდა მოგება:</span>
                <span className="font-mono">+{lastClosedReport.productProfit.toLocaleString()} ₾</span>
              </p>
              <p className="flex justify-between text-rose-600">
                <span>უპოვარი დავალიანებები (კრედიტი):</span>
                <span className="font-mono">{lastClosedReport.totalOutstanding.toLocaleString()} ₾</span>
              </p>
            </div>

            <div className="border-b border-dashed border-slate-300 my-4" />

            <div className="text-xs space-y-2">
              <span className="text-[9px] font-black uppercase text-slate-500 block leading-tight">სალარო ნაღდი / უნაღდო დეტალები:</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-700">
                <div>ნაღდი: <b>{lastClosedReport.totalCash}₾</b></div>
                <div>ბარათი: <b>{lastClosedReport.totalCard}₾</b></div>
                <div>TBC: <b>{lastClosedReport.totalTbc}₾</b></div>
                <div>BOG: <b>{lastClosedReport.totalBog}₾</b></div>
              </div>
            </div>

            {lastClosedReport.itemsSold && lastClosedReport.itemsSold.length > 0 && (
              <>
                <div className="border-b border-dashed border-slate-300 my-3" />
                <div className="text-[11px] space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">გაყიდული პროდუქტების კონსოლიდაცია:</span>
                  {lastClosedReport.itemsSold.map((it: any, i: number) => (
                    <div key={i} className="flex justify-between font-mono text-[10.5px]">
                      <span className="truncate max-w-[180px]">{it.name}</span>
                      <span>{it.quantity}ც ({it.amount}₾)</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="border-b border-dashed border-slate-300 my-4" />

            <div className="p-2.5 bg-slate-100 rounded text-[10px] text-slate-600 font-sans italic">
              <b>ოპერატორის ჩანაწერი:</b> "{lastClosedReport.note}"
            </div>

            <div className="flex gap-2 mt-5 print:hidden select-none">
              <button
                onClick={() => window.print()}
                className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg cursor-pointer text-center"
              >
                ბეჭდვა
              </button>
              <button
                onClick={() => setLastClosedReport(null)}
                className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded-lg cursor-pointer text-center"
              >
                დაფარვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
