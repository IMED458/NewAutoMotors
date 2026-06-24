/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CarServiceOrder, User, ServiceItem, ORDER_STATUS_LABELS, ServiceTypeConfig, Box, RevenueShareConfig, computeRevenueShares, isOwnerLike, boxesForManager, mechanicIdsForManager } from '../types';
import { Calendar, DollarSign, Wrench, Briefcase, ArrowRight, Clock, TrendingUp, Wallet, Users, Boxes, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface MechanicPanelViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  currentUser: User;
  allUsers: User[];
  serviceConfigs: ServiceTypeConfig[];
  boxes: Box[];
  revenueShare: RevenueShareConfig;
  onSelectOrder: (id: string) => void;
}

// ──────────────────────────────────────────────
// Owner (super_admin) profit view
// ──────────────────────────────────────────────
function OwnerProfitView({
  orders,
  services,
  allUsers,
  serviceConfigs,
  onSelectOrder,
}: Omit<MechanicPanelViewProps, 'currentUser'>) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const todayLocal = new Date(currentYear, currentMonth, currentDate);
  const dayOfWeek = todayLocal.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayLocal = new Date(todayLocal);
  mondayLocal.setDate(todayLocal.getDate() + distanceToMonday);
  const sundayLocal = new Date(mondayLocal);
  sundayLocal.setDate(mondayLocal.getDate() + 6);
  sundayLocal.setHours(23, 59, 59, 999);

  // Owner IDs — their earnings stay as profit, not wages
  const ownerIds = new Set(allUsers.filter(u => u.role === 'super_admin').map(u => u.id));

  // Helper: compute revenue + wages for a set of services filtered by order dates
  // Owner's own earnings are NOT counted as wages (they roll into profit)
  const computeStats = (srvList: ServiceItem[]) => {
    const revenue = srvList.reduce((s, x) => s + x.price, 0);
    const wages = srvList.reduce((s, x) => {
      const mechWage = ownerIds.has(x.mechanicId) ? 0 : x.mechanicEarning;
      const coWage = (x.coMechanicId && ownerIds.has(x.coMechanicId)) ? 0 : (x.coMechanicEarning || 0);
      const mgrWage = (x.serviceManagerId && !ownerIds.has(x.serviceManagerId)) ? (x.serviceManagerEarning || 0) : 0;
      return s + mechWage + coWage + mgrWage;
    }, 0);
    return { revenue, wages, profit: revenue - wages };
  };

  // Period computations
  const weekServices = services.filter(srv => {
    const o = orders.find(x => x.id === srv.orderId);
    if (!o) return false;
    const d = parseLocalDate(o.date);
    return !isNaN(d.getTime()) && d >= mondayLocal && d <= sundayLocal;
  });

  const monthServices = services.filter(srv => {
    const o = orders.find(x => x.id === srv.orderId);
    if (!o) return false;
    const d = parseLocalDate(o.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const yearServices = services.filter(srv => {
    const o = orders.find(x => x.id === srv.orderId);
    if (!o) return false;
    const d = parseLocalDate(o.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear;
  });

  const allTimeStats = computeStats(services);
  const weekStats = computeStats(weekServices);
  const monthStats = computeStats(monthServices);
  const yearStats = computeStats(yearServices);

  // Custom date range
  const filteredServices = services.filter(srv => {
    if (!startDate && !endDate) return true;
    const o = orders.find(x => x.id === srv.orderId);
    if (!o) return false;
    if (startDate && o.date < startDate) return false;
    if (endDate && o.date > endDate) return false;
    return true;
  });
  const filteredStats = computeStats(filteredServices);

  // Per-employee wages (all time)
  const nonOwnerUsers = allUsers.filter(u => !ownerIds.has(u.id) && u.role !== 'developer');
  const employeeWages = nonOwnerUsers.map(u => {
    const wages = services.reduce((sum, s) => {
      let w = 0;
      if (s.mechanicId === u.id) w += s.mechanicEarning;
      if (s.coMechanicId === u.id) w += (s.coMechanicEarning || 0);
      if (s.serviceManagerId === u.id) w += (s.serviceManagerEarning || 0);
      return sum + w;
    }, 0);
    return { user: u, wages };
  }).filter(e => e.wages > 0).sort((a, b) => b.wages - a.wages);

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find(c => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  const StatCard = ({
    label, revenue, wages, profit, color, icon,
  }: {
    label: string; revenue: number; wages: number; profit: number;
    color: string; icon: React.ReactNode;
  }) => (
    <div className={`bg-slate-900 border ${color} rounded-2xl p-4 shadow-md relative overflow-hidden`}>
      <div className="absolute right-2 bottom-1 opacity-[0.07]">{icon}</div>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">{label}</span>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">შემოსავალი</span>
          <span className="font-mono font-bold text-slate-100">{revenue.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">ხელფასები</span>
          <span className="font-mono font-bold text-rose-400">−{wages.toLocaleString()} ₾</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-800/60 mt-1">
          <span className="text-slate-300 font-semibold">სუფთა მოგება</span>
          <span className={`font-mono font-black text-base ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profit >= 0 ? '' : '−'}{Math.abs(profit).toLocaleString()} ₾
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Owner banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-amber-200">მფლობელის პანელი</span>
          <h2 className="text-xl font-black font-sans mt-0.5">ფინანსური მიმოხილვა</h2>
          <p className="text-[11px] text-amber-100/90 mt-1 font-sans">
            შემოსავალი, ხელოსნების ხელფასი და თქვენი სუფთა მოგება.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <Wallet className="w-40 h-40 rotate-[15deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      {/* Period stats */}
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        პერიოდების მიხედვით
      </h3>
      <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
        <StatCard label="ამ კვირა" {...weekStats} color="border-cyan-500/20" icon={<Calendar className="w-16 h-16" />} />
        <StatCard label="ამ თვე" {...monthStats} color="border-emerald-500/20" icon={<Briefcase className="w-16 h-16" />} />
        <StatCard label="ამ წელი" {...yearStats} color="border-amber-500/20" icon={<TrendingUp className="w-16 h-16" />} />
        <StatCard label="სულ ყველა დრო" {...allTimeStats} color="border-indigo-500/20" icon={<DollarSign className="w-16 h-16" />} />
      </div>

      {/* Custom date range */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          თარიღის ფილტრი
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-დან</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 text-slate-200" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-მდე</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 text-slate-200" />
          </div>
        </div>
        {(startDate || endDate) && (
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">შემოსავალი</span>
              <span className="font-mono font-bold text-slate-100">{filteredStats.revenue.toLocaleString()} ₾</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">ხელფასები</span>
              <span className="font-mono font-bold text-rose-400">−{filteredStats.wages.toLocaleString()} ₾</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-slate-800/60">
              <span className="text-slate-200 font-semibold">სუფთა მოგება</span>
              <span className={`font-mono font-black ${filteredStats.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {filteredStats.profit >= 0 ? '' : '−'}{Math.abs(filteredStats.profit).toLocaleString()} ₾
              </span>
            </div>
            <button onClick={() => { setStartDate(''); setEndDate(''); }}
              className="w-full mt-1 text-[10px] font-bold text-rose-400 py-1 bg-slate-900 border border-slate-800 rounded-lg cursor-pointer">
              ფილტრის მოხსნა
            </button>
          </div>
        )}
      </div>

      {/* Per-employee wages */}
      {employeeWages.length > 0 && (
        <>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> თანამშრომლების ხელფასი (სულ)
          </h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5">
            {employeeWages.map(({ user, wages }) => (
              <div key={user.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                <span className="text-sm text-slate-300 font-semibold">{user.firstName} {user.lastName}</span>
                <span className="font-mono font-bold text-rose-400">{wages.toLocaleString()} ₾</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
              <span className="text-xs text-slate-400 font-bold uppercase">სულ ხელფასები</span>
              <span className="font-mono font-black text-rose-400 text-sm">{allTimeStats.wages.toLocaleString()} ₾</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Employee earnings view (admin / mechanic)
// ──────────────────────────────────────────────
function EmployeeEarningsView({
  orders,
  services,
  currentUser,
  serviceConfigs,
  onSelectOrder,
}: Omit<MechanicPanelViewProps, 'allUsers'>) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const mechanicServices = services.filter(s =>
    s.mechanicId === currentUser.id || s.coMechanicId === currentUser.id
  );

  const getEarning = (s: typeof services[0]) =>
    s.mechanicId === currentUser.id ? s.mechanicEarning : (s.coMechanicEarning || 0);

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return new Date(NaN);
    const [year, month, day] = parts.map(Number);
    return new Date(year, month - 1, day);
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  const todayLocal = new Date(currentYear, currentMonth, currentDate);
  const dayOfWeek = todayLocal.getDay();
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const mondayLocal = new Date(todayLocal);
  mondayLocal.setDate(todayLocal.getDate() + distanceToMonday);
  const sundayLocal = new Date(mondayLocal);
  sundayLocal.setDate(mondayLocal.getDate() + 6);
  sundayLocal.setHours(23, 59, 59, 999);

  let weekEarnings = 0;
  let monthEarnings = 0;
  let yearEarnings = 0;
  const totalLifetimeEarnings = mechanicServices.reduce((sum, s) => sum + getEarning(s), 0);

  mechanicServices.forEach(srv => {
    const orderObj = orders.find(o => o.id === srv.orderId);
    if (!orderObj) return;
    const orderDate = parseLocalDate(orderObj.date);
    if (isNaN(orderDate.getTime())) return;
    if (orderDate >= mondayLocal && orderDate <= sundayLocal) weekEarnings += getEarning(srv);
    if (orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth) monthEarnings += getEarning(srv);
    if (orderDate.getFullYear() === currentYear) yearEarnings += getEarning(srv);
  });

  const filteredServices = mechanicServices.filter(srv => {
    const orderObj = orders.find(o => o.id === srv.orderId);
    if (!orderObj) return false;
    if (startDate && orderObj.date < startDate) return false;
    if (endDate && orderObj.date > endDate) return false;
    return true;
  });

  const filteredEarningsSum = filteredServices.reduce((sum, s) => sum + getEarning(s), 0);

  const getServiceLabel = (typeId: string) => {
    const conf = serviceConfigs.find(c => c.id === typeId);
    return conf ? conf.name : typeId;
  };

  const orderIdsMatched = Array.from(new Set(filteredServices.map(s => s.orderId)));
  const mechanicOrdersFiltered = orders.filter(o => orderIdsMatched.includes(o.id));

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      {/* Bio banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-700 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-cyan-200">ჩემი პანელი</span>
          <h2 className="text-xl font-black font-sans mt-0.5">
            გამარჯობა, {currentUser.firstName} {currentUser.lastName}!
          </h2>
          <p className="text-[11px] text-cyan-100/90 mt-1 font-sans">
            აქ ნახავთ თქვენს მიერ შესრულებულ სამუშაოებს და გამომუშავებულ წილს.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <Wrench className="w-40 h-40 rotate-[35deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5">
        ჩემი ფინანსური მაჩვენებლები
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">კვირის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-cyan-400">{weekEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">ორშაბათიდან კვირის ჩათვლით</p>
          <div className="absolute right-2 bottom-1 text-cyan-500/10"><Calendar className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">თვის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-emerald-400">{monthEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე თვე</p>
          <div className="absolute right-2 bottom-1 text-emerald-500/10"><Briefcase className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">წლის ნამუშევარი</span>
          <div className="text-xl font-black font-mono mt-1 text-amber-500">{yearEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთელი მიმდინარე წელი</p>
          <div className="absolute right-2 bottom-1 text-amber-500/10"><Clock className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl shadow relative overflow-hidden">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">ჯამური გამომუშავება</span>
          <div className="text-xl font-black font-mono mt-1 text-indigo-400">{totalLifetimeEarnings.toLocaleString()} ₾</div>
          <p className="text-[9px] text-slate-500 mt-0.5 font-sans">მთლიანი მუშაობის პერიოდი</p>
          <div className="absolute right-2 bottom-1 text-indigo-500/10"><DollarSign className="w-10 h-10 -mr-2 -mb-2" /></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          გამომუშავების ფილტრი თარიღებით
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-დან (თარიღი)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 text-slate-200" />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-მდე (თარიღი)</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500 text-slate-200" />
          </div>
        </div>
        {(startDate || endDate) && (
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-lg flex items-center justify-between text-xs font-sans">
            <div>
              <span className="text-[9px] text-slate-500 uppercase font-black block leading-none mb-0.5">გაფილტრული წილი:</span>
              <span className="font-mono text-emerald-400 font-extrabold text-sm">{filteredEarningsSum.toLocaleString()} ₾</span>
            </div>
            <button onClick={() => { setStartDate(''); setEndDate(''); }}
              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[10px] font-bold text-rose-400 rounded-lg cursor-pointer transition-colors border border-slate-800/80">
              ფილტრის მოხსნა
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-3">
        დავალებები ჩემი მონაწილეობით ({mechanicOrdersFiltered.length})
      </h3>

      {mechanicOrdersFiltered.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
          ითავებდა ან მითითებულ შუალედში დავალებები არ ფიქსირდება.
        </div>
      ) : (
        <div className="space-y-4">
          {mechanicOrdersFiltered.map(order => {
            const myOrderServices = filteredServices.filter(s => s.orderId === order.id);
            const myEarnOnThisOrder = myOrderServices.reduce((sum, s) => sum + getEarning(s), 0);
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl shadow hover:border-slate-700 cursor-pointer group transition-all"
              >
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-mono leading-none">{order.date}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase tracking-tight">{order.carBrand}</h4>
                  </div>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-300">{order.carNumber}</span>
                </div>
                <div className="space-y-1 mb-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block mb-1">ჩემი შესრულებული მომსახურებები:</span>
                  {myOrderServices.map(srv => (
                    <div key={srv.id} className="text-[11px] text-slate-300 flex justify-between gap-2">
                      <span>• {getServiceLabel(srv.serviceType)} — {srv.description}</span>
                      <span className="text-cyan-400 font-mono font-bold">+{getEarning(srv)} ₾</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/40 text-xs text-slate-400">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    order.status === 'completed' ? 'bg-green-950/40 border border-green-500/20 text-green-400'
                    : order.status === 'pending' ? 'bg-sky-950/40 border border-sky-500/20 text-sky-400'
                    : 'bg-amber-950/40 border border-amber-500/20 text-amber-400'
                  }`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-amber-500 hover:text-amber-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer">
                    დავალებაზე შესვლა <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Service manager panel — own boxes, own mechanics, own & their wages
// ──────────────────────────────────────────────
function ServiceManagerPanelView({ orders, services, currentUser, allUsers, boxes, revenueShare }: MechanicPanelViewProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const myBoxes = boxesForManager(boxes, currentUser.id);
  const myMechanicIds = mechanicIdsForManager(boxes, currentUser.id);

  const orderById = new Map(orders.map(order => [order.id, order]));
  const myBoxIds = new Set(myBoxes.map(box => box.id));
  const inRange = (service: ServiceItem) => {
    const date = orderById.get(service.orderId)?.date || service.createdAt.slice(0, 10);
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    return true;
  };
  const managesService = (service: ServiceItem) => {
    const order = orderById.get(service.orderId);
    return service.serviceManagerId === currentUser.id || order?.serviceManagerId === currentUser.id || (!!order?.boxId && myBoxIds.has(order.boxId)) ||
      (order?.assignedEmployeeIds || []).some(id => myMechanicIds.includes(id));
  };
  const filtered = services.filter(service => managesService(service) && inRange(service));
  const managerShareFor = (service: ServiceItem) => {
    const order = orderById.get(service.orderId);
    if (service.serviceManagerId === currentUser.id && service.serviceManagerEarning !== undefined) return service.serviceManagerEarning;
    return computeRevenueShares(service.price, order?.clientSource, revenueShare).serviceManagerEarning;
  };

  const myEarnings = filtered.reduce((sum, service) => sum + managerShareFor(service), 0);
  const paidManagerEarnings = filtered.reduce((sum, service) => orderById.get(service.orderId)?.paymentStatus === 'paid' ? sum + managerShareFor(service) : sum, 0);
  const managerTurnover = filtered.reduce((sum, service) => sum + service.price, 0);

  const mechWage = (id: string) => filtered.reduce((sum, s) => {
    let w = 0;
    if (s.mechanicId === id) w += s.mechanicEarning;
    if (s.coMechanicId === id) w += (s.coMechanicEarning || 0);
    return sum + w;
  }, 0);

  const userName = (id: string) => {
    const u = allUsers.find(x => x.id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() : '—';
  };

  const mechanicsRows = myMechanicIds.map(id => ({ id, name: userName(id), wage: mechWage(id) }))
    .sort((a, b) => b.wage - a.wage);
  const teamTotal = mechanicsRows.reduce((s, r) => s + r.wage, 0);

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="bg-gradient-to-r from-amber-600 to-orange-700 rounded-2xl p-5 mb-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs uppercase tracking-widest font-black text-amber-200">სერვის მენეჯერის პანელი</span>
          <h2 className="text-xl font-black mt-0.5">{currentUser.firstName} {currentUser.lastName}</h2>
          <p className="text-[11px] text-amber-100/90 mt-1">თქვენი ბოქსები, ხელოსნები და ანაზღაურება.</p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center justify-center">
          <ShieldCheck className="w-40 h-40 rotate-[15deg] translate-x-10 translate-y-10" />
        </div>
      </div>

      {/* Date filter */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-დან</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
        </div>
        <div>
          <label className="block text-[10px] text-slate-500 mb-0.5 uppercase font-semibold">-მდე</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5 md:grid-cols-4">
        <div className="bg-slate-900 border border-amber-500/20 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">გამოანგარიშებული ხელფასი</span>
          <div className="text-lg font-black font-mono mt-1 text-amber-400">{myEarnings.toLocaleString()} ₾</div>
        </div>
        <div className="bg-slate-900 border border-emerald-500/20 p-3.5 rounded-xl"><span className="text-[10px] text-slate-400 font-bold uppercase block">გადახდილი წილი</span><div className="text-lg font-black font-mono mt-1 text-emerald-400">{paidManagerEarnings.toLocaleString()} ₾</div></div>
        <div className="bg-slate-900 border border-cyan-500/20 p-3.5 rounded-xl"><span className="text-[10px] text-slate-400 font-bold uppercase block">ჩემი ბოქსების ბრუნვა</span><div className="text-lg font-black font-mono mt-1 text-cyan-400">{managerTurnover.toLocaleString()} ₾</div></div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1"><Boxes className="w-3 h-3" /> ბოქსები</span>
          <div className="text-lg font-black font-mono mt-1 text-slate-200">{myBoxes.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
          <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1"><Wrench className="w-3 h-3" /> ხელოსნები</span>
          <div className="text-lg font-black font-mono mt-1 text-slate-200">{myMechanicIds.length}</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 mb-5 text-xs">
        <div className="flex justify-between"><span className="text-slate-400">დარიცხული მენეჯერის წილი</span><b className="font-mono text-amber-400">{myEarnings.toLocaleString()} ₾</b></div>
        <div className="flex justify-between mt-2"><span className="text-slate-400">გადახდილი შეკვეთებიდან</span><b className="font-mono text-emerald-400">{paidManagerEarnings.toLocaleString()} ₾</b></div>
        <div className="flex justify-between mt-2 pt-2 border-t border-slate-800"><span className="text-slate-300 font-bold">გადასახდელი / გადაუხდელი შეკვეთების წილი</span><b className="font-mono text-rose-400">{(myEarnings - paidManagerEarnings).toLocaleString()} ₾</b></div>
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
        <Users className="w-3.5 h-3.5" /> ჩემი ხელოსნების ანაზღაურება
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 space-y-2.5">
        {mechanicsRows.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3">ბოქსებში ხელოსნები ჯერ არ არის მიბმული.</p>
        ) : (
          <>
            {mechanicsRows.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                <span className="text-sm text-slate-300 font-semibold">{r.name}</span>
                <span className="font-mono font-bold text-cyan-400">{r.wage.toLocaleString()} ₾</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
              <span className="text-xs text-slate-400 font-bold uppercase">გუნდის ჯამი</span>
              <span className="font-mono font-black text-cyan-400 text-sm">{teamTotal.toLocaleString()} ₾</span>
            </div>
          </>
        )}
      </div>

      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1 mb-2.5 flex items-center gap-1.5">
        <Boxes className="w-3.5 h-3.5" /> ჩემი ბოქსები
      </h3>
      <div className="space-y-2">
        {myBoxes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-3 bg-slate-900/40 rounded-xl border border-slate-800">ბოქსები ჯერ არ გაქვთ მინიჭებული.</p>
        ) : myBoxes.map(b => (
          <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <span className="font-bold text-slate-200 flex items-center gap-2"><Boxes className="w-4 h-4 text-amber-400" /> {b.name}</span>
            <span className="text-[11px] text-slate-500">{(b.mechanicIds || []).length} ხელოსანი</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main export — switches based on role
// ──────────────────────────────────────────────
export default function MechanicPanelView(props: MechanicPanelViewProps) {
  if (isOwnerLike(props.currentUser.role)) {
    return (
      <OwnerProfitView
        orders={props.orders}
        services={props.services}
        allUsers={props.allUsers}
        serviceConfigs={props.serviceConfigs}
        boxes={props.boxes}
        revenueShare={props.revenueShare}
        onSelectOrder={props.onSelectOrder}
      />
    );
  }
  if (props.currentUser.role === 'service_manager') {
    return <ServiceManagerPanelView {...props} />;
  }
  return <EmployeeEarningsView {...props} />;
}
