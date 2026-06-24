import { useState } from 'react';
import {
  CarServiceOrder, User, ServiceItem, ServiceTypeConfig,
  ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../types';
import { Search, Filter, Phone, User as UserIcon, HelpCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

function formatPlate(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
}

interface HistoryViewProps {
  orders: CarServiceOrder[];
  services: ServiceItem[];
  mechanics: User[];
  serviceConfigs: ServiceTypeConfig[];
  currentUser: User;
  allUsers: User[];
  onSelectOrder: (id: string) => void;
}

export default function HistoryView({ orders, services, mechanics, serviceConfigs, currentUser, allUsers, onSelectOrder }: HistoryViewProps) {
  const [filterCarPlate, setFilterCarPlate] = useState('');
  const [filterClientName, setFilterClientName] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMechanicId, setFilterMechanicId] = useState('');
  const [filterServiceType, setFilterServiceType] = useState<string>('');
  const [filterPayment, setFilterPayment] = useState<string>('');
  const [filterWorkStatus, setFilterWorkStatus] = useState<string>('all');
  // #11: source filter — cars I added vs cars a service manager added
  const [filterSource, setFilterSource] = useState<'all' | 'mine' | 'manager'>('all');

  const roleOf = (userId: string) => allUsers.find(u => u.id === userId)?.role;
  const isMechanic = currentUser.role === 'mechanic';

  const resetFilters = () => {
    setFilterCarPlate('');
    setFilterClientName('');
    setFilterDate('');
    setFilterMechanicId('');
    setFilterServiceType('');
    setFilterPayment('');
    setFilterWorkStatus('all');
    setFilterSource('all');
  };

  const getServiceLabel = (typeId: string) => serviceConfigs.find(c => c.id === typeId)?.name || typeId;

  const filteredOrders = orders.filter((order) => {
    if (filterCarPlate && !order.carNumber.toLowerCase().includes(filterCarPlate.toLowerCase())) return false;
    if (filterClientName && !order.clientFullName.toLowerCase().includes(filterClientName.toLowerCase().trim())) return false;
    if (filterDate && order.date !== filterDate) return false;
    if (filterPayment && order.paymentStatus !== filterPayment) return false;
    if (filterWorkStatus !== 'all') {
      if (filterWorkStatus === 'completed' && order.status !== 'completed') return false;
      if (filterWorkStatus === 'ongoing' && order.status === 'completed') return false;
    }
    if (filterSource === 'mine' && order.createdBy !== currentUser.id) return false;
    if (filterSource === 'manager' && roleOf(order.createdBy) !== 'service_manager') return false;
    const orderSrvList = services.filter(s => s.orderId === order.id);
    if (filterMechanicId && !orderSrvList.some(s => s.mechanicId === filterMechanicId || s.coMechanicId === filterMechanicId)) return false;
    if (filterServiceType && !orderSrvList.some(s => s.serviceType === filterServiceType)) return false;
    return true;
  });

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-6xl md:px-8 lg:px-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold font-sans tracking-tight text-slate-100 flex items-center gap-2">
          <span className="bg-cyan-500/10 p-2 rounded-xl text-cyan-400 border border-cyan-500/20">
            <Filter className="w-5 h-5" />
          </span>
          სერვისების ისტორია
        </h2>
        <button
          id="reset-history-filters-btn"
          onClick={resetFilters}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> გასუფთავება
        </button>
      </div>

      {/* Source filter (#11): mine / manager-added */}
      {isMechanic && (
        <div className="flex gap-1.5 mb-4">
          {([
            { id: 'all', label: 'ყველა' },
            { id: 'mine', label: 'ჩემი დამატებული' },
            { id: 'manager', label: 'მენეჯერის დამატებული' },
          ] as { id: 'all' | 'mine' | 'manager'; label: string }[]).map(opt => (
            <button key={opt.id} onClick={() => setFilterSource(opt.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
                filterSource === opt.id
                  ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100'
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
          ფილტრები და პარამეტრები
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">სახ. ნომერი</label>
            <input
              id="filter-plate"
              type="text"
              value={filterCarPlate}
              onChange={e => setFilterCarPlate(formatPlate(e.target.value))}
              placeholder="მაგ: ZZ-777-YY"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs placeholder-slate-700 focus:outline-none focus:border-cyan-500/60 font-mono uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">კლიენტის სახელი</label>
            <input
              id="filter-client"
              type="text"
              value={filterClientName}
              onChange={e => setFilterClientName(e.target.value)}
              placeholder="მაგ: გიორგი"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs placeholder-slate-700 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">თარიღი</label>
            <input
              id="filter-date-picker"
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">გადახდის სტატუსი</label>
            <select
              id="filter-payment-status"
              value={filterPayment}
              onChange={e => setFilterPayment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60"
            >
              <option value="">ყველა</option>
              <option value="unpaid">გადაუხდელია</option>
              <option value="paid">გადახდილია</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">ხელოსანი</label>
            <select
              id="filter-mechanic-user"
              value={filterMechanicId}
              onChange={e => setFilterMechanicId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="">ყველა ხელოსანი</option>
              {mechanics.map(mech => (
                <option key={mech.id} value={mech.id}>{mech.firstName} {mech.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">კატეგორია</label>
            <select
              id="filter-category-select"
              value={filterServiceType}
              onChange={e => setFilterServiceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="">ყველა ტიპი</option>
              {serviceConfigs.map(cfg => (
                <option key={cfg.id} value={cfg.id}>{cfg.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-0.5">სამუშაოს სტატუსი</label>
            <select
              id="filter-work-status"
              value={filterWorkStatus}
              onChange={e => setFilterWorkStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 font-sans"
            >
              <option value="all">ყველა სამუშაო</option>
              <option value="completed">მხოლოდ დასრულებული</option>
              <option value="ongoing">მიმდინარე / დაუსრულებელი</option>
            </select>
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center text-slate-600">
          <HelpCircle className="w-10 h-10 mb-2 text-slate-700" />
          <p className="font-sans text-xs">არცერთი ჩანაწერი არ ემთხვევა მოცემულ ფილტრებს</p>
        </div>
      ) : (
        <div className="space-y-1 mb-3">
          <span className="text-slate-500 text-xs px-1">ნაპოვნია <b>{filteredOrders.length}</b> მანქანა</span>
        </div>
      )}

      {filteredOrders.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => {
            const orderSrvList = services.filter(s => s.orderId === order.id);
            const totalCost = orderSrvList.reduce((sum, s) => sum + s.price, 0);
            const totalEarning = orderSrvList.reduce((sum, s) => sum + s.mechanicEarning + (s.coMechanicEarning || 0), 0);

            const uniqueMechNames = Array.from(new Set([
              ...orderSrvList.map(srv => {
                const m = mechanics.find(m => m.id === srv.mechanicId);
                return m ? `${m.firstName} ${m.lastName}` : null;
              }),
              ...orderSrvList.filter(s => s.coMechanicId).map(srv => {
                const m = mechanics.find(m => m.id === srv.coMechanicId);
                return m ? `${m.firstName} ${m.lastName}` : null;
              }),
            ].filter((n): n is string => !!n)));

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={order.id}
                onClick={() => onSelectOrder(order.id)}
                className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-colors p-4 rounded-xl shadow-md cursor-pointer block group"
              >
                <div className="flex items-start justify-between mb-2 pb-2 border-b border-slate-800/60 font-sans">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono block leading-none mb-1">{order.date}</span>
                    <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight">{order.carBrand}</h4>
                  </div>
                  <div className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-xs font-mono font-bold tracking-widest text-slate-200">
                    {order.carNumber}
                  </div>
                </div>

                {uniqueMechNames.length > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-2 px-1">
                    <span className="font-semibold text-amber-500">მომუშავე პერსონალი:</span>
                    <span className="text-slate-250 font-medium">{uniqueMechNames.join(', ')}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-400 font-sans mb-3">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-3 h-3 text-slate-500" />
                    <span className="truncate">{order.clientFullName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{order.clientPhone}</span>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 mb-3">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                    ჩატარებული მომსახურებები ({orderSrvList.length}):
                  </span>
                  {orderSrvList.length === 0 ? (
                    <span className="text-[10px] text-slate-600 italic">დამატებული მომსახურებები არ არის</span>
                  ) : (
                    <div className="space-y-1">
                      {orderSrvList.map((srv) => {
                        const mObj = mechanics.find(x => x.id === srv.mechanicId);
                        return (
                          <div key={srv.id} className="text-[10.5px] text-slate-300 flex justify-between gap-2.5">
                            <span className="truncate">
                              • <b className="text-amber-500">{getServiceLabel(srv.serviceType)}</b>: {srv.description}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap">
                              ({mObj?.firstName || 'ხელოსანი'} - {srv.price}₾)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="flex gap-1.5 items-center">
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-500/20 text-green-400 border-green-500/20'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                    }`}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded border ${
                      order.status === 'completed'
                        ? 'bg-green-950/40 text-green-400 border-green-500/20'
                        : order.status === 'pending'
                        ? 'bg-sky-950/40 text-sky-400 border-sky-500/20'
                        : 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                    }`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="text-right text-[11px] font-mono">
                    <div className="text-slate-300">ჯამი: <b className="text-slate-100 font-bold">{totalCost} ₾</b></div>
                    <div className="text-slate-500">ხელოსნებს: <b className="text-cyan-400">{totalEarning} ₾</b></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
