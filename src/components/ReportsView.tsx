import { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Download, Store, Users, Wallet } from 'lucide-react';
import { Box, CarServiceOrder, ProductSale, ServiceItem, User, computeRevenueShares, mechanicIdsForManager } from '../types';

interface ReportsViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  productSales: ProductSale[];
  allUsers: User[];
  boxes: Box[];
  currentUser: User;
  onExportExcel?: () => void;
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all';
const money = (value: number) => `${value.toLocaleString('ka-GE', { maximumFractionDigits: 2 })} ₾`;

function inPeriod(date: string, period: Period, selectedDate: string) {
  if (period === 'all') return true;
  const value = new Date(`${date}T00:00:00`);
  const anchor = new Date(`${selectedDate}T00:00:00`);
  if (Number.isNaN(value.getTime())) return false;
  const start = new Date(anchor);
  if (period === 'day') return date === selectedDate;
  if (period === 'week') start.setDate(start.getDate() - 6);
  if (period === 'month') start.setMonth(start.getMonth() - 1);
  if (period === 'year') start.setFullYear(start.getFullYear() - 1);
  return value >= start && value <= anchor;
}

export default function ReportsView({ orders, services, productSales, allUsers, boxes, currentUser, onExportExcel }: ReportsViewProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const isServiceManager = currentUser.role === 'service_manager';
  const managedMechanics = useMemo(() => new Set(mechanicIdsForManager(boxes, currentUser.id)), [boxes, currentUser.id]);
  const managedBoxIds = useMemo(() => new Set(boxes.filter(box => box.serviceManagerId === currentUser.id).map(box => box.id)), [boxes, currentUser.id]);

  // A service manager never gets another box's figures. Accountant and owner-like roles see the complete ledger.
  const allowedOrders = useMemo(() => isServiceManager
    ? orders.filter(order => order.serviceManagerId === currentUser.id || (!!order.boxId && managedBoxIds.has(order.boxId)) || (order.assignedEmployeeIds || []).some(id => managedMechanics.has(id)))
    : orders, [orders, isServiceManager, currentUser.id, managedBoxIds, managedMechanics]);
  const periodOrders = useMemo(() => allowedOrders.filter(order => inPeriod(order.date, period, selectedDate)), [allowedOrders, period, selectedDate]);
  const orderIds = useMemo(() => new Set(periodOrders.map(order => order.id)), [periodOrders]);
  const orderById = useMemo(() => new Map(periodOrders.map(order => [order.id, order])), [periodOrders]);
  const periodServices = useMemo(() => services.filter(service => orderIds.has(service.orderId)), [services, orderIds]);
  const periodSales = useMemo(() => productSales.filter(sale => inPeriod(sale.date, period, selectedDate)), [productSales, period, selectedDate]);

  const serviceTotal = periodServices.reduce((sum, item) => sum + item.price, 0);
  const servicePaid = periodServices.reduce((sum, item) => sum + (periodOrders.find(order => order.id === item.orderId)?.paymentStatus === 'paid' ? item.price : 0), 0);
  const serviceUnpaid = serviceTotal - servicePaid;
  const storeRevenue = periodSales.reduce((sum, sale) => sum + sale.finalAmount, 0);
  const storePaid = periodSales.reduce((sum, sale) => sum + (sale.paymentStatus === 'paid' ? sale.finalAmount : 0), 0);
  const storeProfit = periodSales.reduce((sum, sale) => sum + sale.items.reduce((saleProfit, item) => saleProfit + ((item.salePrice - item.purchasePrice) * item.quantity), 0) - sale.discount, 0);
  const totalPaid = servicePaid + storePaid;
  const uniqueClients = new Set([...periodOrders.map(order => `${order.clientFullName}|${order.clientPhone}`), ...periodSales.map(sale => `${sale.clientName}|${sale.clientPhone}`)]).size;

  const managerIdForService = (service: ServiceItem) => {
    if (service.serviceManagerId) return service.serviceManagerId;
    const order = orderById.get(service.orderId);
    return order?.serviceManagerId || boxes.find(box => box.id === order?.boxId)?.serviceManagerId;
  };
  const managerEarningForService = (service: ServiceItem) => {
    if (service.serviceManagerEarning !== undefined) return service.serviceManagerEarning;
    return computeRevenueShares(service.price, orderById.get(service.orderId)?.clientSource, undefined).serviceManagerEarning;
  };
  const paymentMethods = ['cash', 'card', 'tbc', 'bog', 'transfer'] as const;
  const paymentMethodLabels = { cash: 'ნაღდი', card: 'ბარათი', tbc: 'TBC', bog: 'BOG', transfer: 'გადარიცხვა' };
  const paymentRows = paymentMethods.map(method => {
    const serviceAmount = periodServices.reduce((sum, service) => orderById.get(service.orderId)?.paymentStatus === 'paid' && (orderById.get(service.orderId)?.paymentMethod || 'cash') === method ? sum + service.price : sum, 0);
    const storeAmount = periodSales.reduce((sum, sale) => sale.paymentStatus === 'paid' && sale.paymentMethod === method ? sum + sale.finalAmount : sum, 0);
    return { method, amount: serviceAmount + storeAmount };
  });
  const receivables = periodOrders.filter(order => order.paymentStatus === 'unpaid').map(order => ({
    id: order.id, date: order.date, client: order.clientFullName, phone: order.clientPhone, vehicle: `${order.carBrand} ${order.carNumber}`,
    amount: periodServices.filter(service => service.orderId === order.id).reduce((sum, service) => sum + service.price, 0),
  })).filter(item => item.amount > 0);
  const boxRows = boxes.map(box => {
    const boxServices = periodServices.filter(service => orderById.get(service.orderId)?.boxId === box.id);
    return { box, turnover: boxServices.reduce((sum, service) => sum + service.price, 0), paid: boxServices.reduce((sum, service) => orderById.get(service.orderId)?.paymentStatus === 'paid' ? sum + service.price : sum, 0), jobs: boxServices.length };
  }).filter(row => row.jobs > 0);

  const employees = isServiceManager ? allUsers.filter(user => managedMechanics.has(user.id)) : allUsers.filter(user => user.role !== 'developer');
  const employeeRows = employees.map(user => {
    const assigned = periodServices.filter(item => item.mechanicId === user.id || item.coMechanicId === user.id);
    const earnings = assigned.reduce((sum, item) => sum + (item.mechanicId === user.id ? item.mechanicEarning : item.coMechanicEarning || 0), 0);
    const managerEarnings = periodServices.filter(item => managerIdForService(item) === user.id).reduce((sum, item) => sum + managerEarningForService(item), 0);
    return { user, jobs: assigned.length, turnover: assigned.filter(item => item.mechanicId === user.id).reduce((sum, item) => sum + item.price, 0), earnings: earnings + managerEarnings };
  }).filter(row => row.jobs > 0 || row.earnings > 0);

  const exportCsv = () => {
    const rows = periodOrders.map(order => {
      const total = periodServices.filter(item => item.orderId === order.id).reduce((sum, item) => sum + item.price, 0);
      return [order.date, order.clientFullName, order.clientPhone, order.carBrand, order.carNumber, total, order.paymentStatus].map(value => `"${String(value).replaceAll('"', '""')}"`).join(',');
    });
    const blob = new Blob(['\uFEFF' + ['თარიღი,კლიენტი,ტელეფონი,ავტომობილი,ნომერი,სერვისის თანხა,გადახდა', ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `ფინანსური-რეპორტი-${selectedDate}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <div className="max-w-6xl mx-auto p-4 pb-24 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black flex items-center gap-2"><span className="p-2 rounded-xl bg-amber-500/10 text-amber-400"><BarChart3 className="w-5 h-5" /></span>{isServiceManager ? 'ჩემი ბოქსების ფინანსები' : currentUser.role === 'accountant' ? 'ბუღალტრის ფინანსური მართვის პანელი' : 'სრული ფინანსური ანალიტიკა'}</h2>{currentUser.role === 'accountant' && <p className="text-xs text-slate-500 mt-1">სერვისი, მაღაზია, სალარო, დავალიანებები, ბოქსები და დარიცხვები ერთ პანელში.</p>}</div><div className="flex gap-2"><button onClick={exportCsv} className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800"><Download className="w-4 h-4 inline mr-1" />CSV</button>{onExportExcel && <button onClick={onExportExcel} className="px-3 py-2 text-xs font-black rounded-xl bg-emerald-500 text-slate-950">Excel</button>}</div></div>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-3 md:flex-row md:items-center"><div className="grid grid-cols-5 gap-1 flex-1">{(['day', 'week', 'month', 'year', 'all'] as Period[]).map(item => <button key={item} onClick={() => setPeriod(item)} className={`py-2 rounded-lg text-xs font-bold ${period === item ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>{({ day: 'დღე', week: 'კვირა', month: 'თვე', year: 'წელი', all: 'სულ' })[item]}</button>)}</div><label className="flex items-center gap-2 text-xs text-slate-400"><CalendarDays className="w-4 h-4" /><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200" /></label></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[["სულ ბრუნვა", serviceTotal + storeRevenue, 'text-slate-100'], ["მიღებული", totalPaid, 'text-emerald-400'], ["დავალიანება", serviceUnpaid + (storeRevenue - storePaid), 'text-rose-400'], ["მაღაზიის მოგება", storeProfit, 'text-cyan-400'], ["კლიენტები", uniqueClients, 'text-amber-400']].map(([label, value, color]) => <div key={String(label)} className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><span className="block text-[10px] uppercase font-bold text-slate-500">{label}</span><b className={`block mt-1 text-lg font-mono ${color}`}>{typeof value === 'number' && label !== 'კლიენტები' ? money(value) : value}</b></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-4"><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm flex gap-2 items-center"><Wallet className="w-4 h-4 text-emerald-400" />შემოსავლების წყაროები</h3><div className="mt-4 space-y-3 text-xs">{[["სერვისი", serviceTotal, servicePaid], ["მაღაზია", storeRevenue, storePaid]].map(([name, total, paid]) => <div key={String(name)} className="bg-slate-950 rounded-xl p-3"><div className="flex justify-between"><b>{name}</b><b>{money(Number(total))}</b></div><div className="flex justify-between mt-1 text-slate-500"><span>მიღებული: {money(Number(paid))}</span><span>დავალიანება: {money(Number(total) - Number(paid))}</span></div></div>)}</div></section><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm flex gap-2 items-center"><Store className="w-4 h-4 text-cyan-400" />მაღაზიის დეტალები</h3><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="bg-slate-950 rounded-xl p-3"><span className="text-slate-500">ტრანზაქციები</span><b className="block text-base mt-1">{periodSales.length}</b></div><div className="bg-slate-950 rounded-xl p-3"><span className="text-slate-500">მოგება</span><b className="block text-base mt-1 text-cyan-400">{money(storeProfit)}</b></div></div></section></div>
    <div className="grid lg:grid-cols-2 gap-4"><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm flex gap-2 items-center"><Wallet className="w-4 h-4 text-emerald-400" />შემოსავლების წყაროები</h3><div className="mt-4 space-y-3 text-xs">{[["სერვისი", serviceTotal, servicePaid], ["მაღაზია", storeRevenue, storePaid]].map(([name, total, paid]) => <div key={String(name)} className="bg-slate-950 rounded-xl p-3"><div className="flex justify-between"><b>{name}</b><b>{money(Number(total))}</b></div><div className="flex justify-between mt-1 text-slate-500"><span>მიღებული: {money(Number(paid))}</span><span>დავალიანება: {money(Number(total) - Number(paid))}</span></div></div>)}</div></section><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm flex gap-2 items-center"><Store className="w-4 h-4 text-cyan-400" />მაღაზიის დეტალები</h3><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div className="bg-slate-950 rounded-xl p-3"><span className="text-slate-500">ტრანზაქციები</span><b className="block text-base mt-1">{periodSales.length}</b></div><div className="bg-slate-950 rounded-xl p-3"><span className="text-slate-500">მოგება</span><b className="block text-base mt-1 text-cyan-400">{money(storeProfit)}</b></div></div></section></div>
    {!isServiceManager && <><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm">სალაროს მოძრაობა — გადახდის მეთოდებით</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">{paymentRows.map(row => <div key={row.method} className="bg-slate-950 border border-slate-800 rounded-xl p-3"><span className="block text-[10px] text-slate-500">{paymentMethodLabels[row.method]}</span><b className="font-mono text-sm text-emerald-400">{money(row.amount)}</b></div>)}</div></section><div className="grid lg:grid-cols-2 gap-4"><section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm">ბოქსების ფინანსური შედეგი</h3><div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-slate-500 border-b border-slate-800"><tr><th className="pb-2">ბოქსი</th><th className="pb-2">სამუშაო</th><th className="pb-2">ბრუნვა</th><th className="pb-2 text-right">მიღებული</th></tr></thead><tbody>{boxRows.map(row => <tr key={row.box.id} className="border-b border-slate-800/50"><td className="py-2"><b>{row.box.name}</b><span className="block text-[10px] text-slate-500">{allUsers.find(user => user.id === row.box.serviceManagerId)?.firstName || '—'}</span></td><td>{row.jobs}</td><td>{money(row.turnover)}</td><td className="text-right text-emerald-400">{money(row.paid)}</td></tr>)}{boxRows.length === 0 && <tr><td colSpan={4} className="py-5 text-center text-slate-500">ბოქსების მონაცემი არ არის.</td></tr>}</tbody></table></div></section><section className="bg-slate-900 border border-rose-500/20 rounded-2xl p-4"><h3 className="font-bold text-sm text-rose-300">დებიტორული დავალიანებები</h3><div className="mt-3 max-h-64 overflow-y-auto space-y-2">{receivables.map(item => <div key={item.id} className="bg-slate-950 rounded-xl p-3 text-xs"><div className="flex justify-between"><b>{item.client}</b><b className="font-mono text-rose-400">{money(item.amount)}</b></div><div className="text-slate-500 mt-1">{item.vehicle} · {item.phone} · {item.date}</div></div>)}{receivables.length === 0 && <p className="text-xs text-slate-500 text-center py-6">გადაუხდელი მომსახურება არ არის.</p>}</div></section></div></>}
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><h3 className="font-bold text-sm flex gap-2 items-center"><Users className="w-4 h-4 text-amber-400" />{isServiceManager ? 'ჩემი ხელოსნების დარიცხვები' : 'თანამშრომლების დარიცხვები'}</h3><div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="text-left text-slate-500 border-b border-slate-800"><tr><th className="pb-2">თანამშრომელი</th><th className="pb-2">სამუშაო</th><th className="pb-2">ბრუნვა</th><th className="pb-2 text-right">დასარიცხი</th></tr></thead><tbody>{employeeRows.map(row => <tr key={row.user.id} className="border-b border-slate-800/60"><td className="py-3 font-bold">{row.user.firstName} {row.user.lastName}</td><td>{row.jobs}</td><td>{money(row.turnover)}</td><td className="text-right text-cyan-400 font-mono font-bold">{money(row.earnings)}</td></tr>)}{employeeRows.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-slate-500">არჩეულ პერიოდში ჩანაწერი არ არის.</td></tr>}</tbody></table></div></section>
  </div>;
}
