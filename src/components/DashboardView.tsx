import { useState } from 'react';
import { CarServiceOrder, User, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '../types';
import { Plus, Search, Car, HelpCircle, Phone, User as UserIcon, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

function formatPlate(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
}

interface DashboardViewProps {
  orders: CarServiceOrder[];
  currentUser: User;
  allUsers: User[];
  onSelectOrder: (id: string) => void;
  onOpenAddOrder: () => void;
}

interface OrderCardProps {
  order: CarServiceOrder;
  allUsers: User[];
  onSelectOrder: (id: string) => void;
  highlight?: boolean;
}

function OrderCard({ order, allUsers, onSelectOrder, highlight }: OrderCardProps) {
  const statusStyle =
    order.status === 'new'
      ? { bg: 'bg-amber-950/50', border: 'border-amber-500/30', text: 'text-amber-400', bar: 'bg-amber-500' }
      : order.status === 'pending'
      ? { bg: 'bg-sky-950/50', border: 'border-sky-500/30', text: 'text-sky-400', bar: 'bg-sky-500' }
      : { bg: 'bg-green-950/50', border: 'border-green-500/30', text: 'text-green-400', bar: 'bg-green-500' };

  const payStyle =
    order.paymentStatus === 'paid'
      ? 'bg-green-500/20 text-green-400 border-green-500/20'
      : 'bg-rose-500/20 text-rose-400 border-rose-500/20';

  const assignees = (order.assignedEmployeeIds || [])
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean) as User[];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => onSelectOrder(order.id)}
      className={`bg-slate-900 border rounded-2xl p-4 shadow-md hover:border-slate-700 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${highlight ? 'border-cyan-500/40' : 'border-slate-800/80'}`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusStyle.bar}`} />

      <div className="flex items-start justify-between mb-2.5 pl-2 gap-2 min-w-0">
        <span className="font-bold text-slate-200 uppercase font-sans tracking-tight truncate flex-1">{order.carBrand}</span>
        <div className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg font-mono font-bold tracking-widest text-slate-200 shadow-inner whitespace-nowrap flex-shrink-0">
          {order.carNumber}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400 pl-2 mb-3 font-sans">
        <div className="flex items-center gap-1.5 min-w-0">
          <UserIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="truncate text-slate-300 font-semibold">{order.clientFullName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span>{order.clientPhone}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span>{order.date}</span>
        </div>
      </div>

      <div className="bg-slate-950 rounded-xl p-2.5 mx-1 border border-slate-800/60 mb-3">
        <span className="text-slate-500 font-semibold block mb-0.5 text-[10px]">პრობლემა:</span>
        <p className="text-xs line-clamp-2 font-sans text-slate-300 break-words">{order.problemDescription}</p>
      </div>

      {assignees.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2.5 pl-2">
          {assignees.map(u => (
            <span key={u.id} className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">
              {u.firstName}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 pl-2 gap-2">
        <div className="flex gap-1.5 flex-wrap min-w-0">
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg border whitespace-nowrap ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg border whitespace-nowrap ${payStyle}`}>
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
          </span>
        </div>
        <span className="text-amber-500 text-xs font-semibold flex items-center gap-0.5 hover:text-amber-400 flex-shrink-0">
          შესვლა <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
}

export default function DashboardView({
  orders,
  currentUser,
  allUsers,
  onSelectOrder,
  onOpenAddOrder,
}: DashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all_active');

  // "My Tasks": orders explicitly assigned to current user that are not completed
  const myTasksCount = orders.filter(o =>
    (o.assignedEmployeeIds || []).includes(currentUser.id) && o.status !== 'completed'
  ).length;

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const plateQ = formatPlate(q.replace(/[^A-Za-z0-9]/g, '')).toLowerCase();
    const matchesSearch =
      q === '' ||
      order.carNumber.toLowerCase().includes(q) ||
      (plateQ.length >= 2 && order.carNumber.toLowerCase().includes(plateQ)) ||
      order.carBrand.toLowerCase().includes(q) ||
      order.clientFullName.toLowerCase().includes(q) ||
      order.clientPhone.includes(q);

    if (!matchesSearch) return false;

    if (selectedStatusFilter === 'my-tasks')
      return (order.assignedEmployeeIds || []).includes(currentUser.id) && order.status !== 'completed';
    if (selectedStatusFilter === 'all_active') return order.status === 'new' || order.status === 'pending';
    if (selectedStatusFilter === 'unpaid') return order.paymentStatus === 'unpaid';
    if (selectedStatusFilter === 'all') return true;
    return order.status === selectedStatusFilter;
  });

  const pills = [
    ...(myTasksCount > 0
      ? [{ id: 'my-tasks', label: `ჩემი დავალებები ${myTasksCount}` }]
      : []),
    { id: 'all_active', label: 'მიმდინარე' },
    { id: 'new', label: 'ახალი' },
    { id: 'pending', label: 'პროცესშია' },
    { id: 'completed', label: 'დასრულებული' },
    { id: 'unpaid', label: 'გადაუხდელია' },
    { id: 'all', label: 'ყველა' },
  ];

  const titleMap: Record<string, string> = {
    'my-tasks': 'ჩემი დავალებები',
    'all_active': 'მიმდინარე დავალებები',
    'new': 'ახალი დავალებები',
    'pending': 'პროცესში მყოფი',
    'completed': 'დასრულებული',
    'unpaid': 'გადაუხდელი',
    'all': 'ყველა დავალება',
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-24 bg-slate-950 text-slate-100 font-sans md:max-w-6xl md:px-8 lg:px-12">
      {/* Admin Action Block */}
      {(currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'manager') && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-6">
          <button
            id="quick-add-car-btn"
            onClick={onOpenAddOrder}
            className="w-full py-4 px-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 hover:from-amber-600 hover:to-amber-800 font-extrabold rounded-2xl flex items-center justify-between shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="bg-slate-950/20 p-2.5 rounded-xl border border-slate-950/10 text-slate-950 flex-shrink-0">
                <Car className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div className="text-left min-w-0">
                <div className="text-base font-sans tracking-tight">ახალი მანქანის რეგისტრაცია</div>
                <div className="text-[11px] text-slate-900 font-sans font-medium opacity-85">კლიენტისა და ავტომობილის მონაცემების შეყვანა</div>
              </div>
            </div>
            <Plus className="w-6 h-6 stroke-[3] flex-shrink-0" />
          </button>
        </motion.div>
      )}

      {/* Title & count */}
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-bold font-sans text-slate-200">
          {titleMap[selectedStatusFilter] ?? 'დავალებები'}
        </h3>
        <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 font-mono font-bold">
          {filteredOrders.length} ჩანაწერი
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          id="dashboard-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ძებნა ნომრით, მარკით ან მფლობელით..."
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 text-slate-100 font-sans"
        />
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-4 scrollbar-none mb-3 -mx-4 px-4">
        {pills.map((pill) => {
          const isMyTasks = pill.id === 'my-tasks';
          const isActive = selectedStatusFilter === pill.id;
          return (
            <button
              id={`filter-pill-${pill.id}`}
              key={pill.id}
              onClick={() => setSelectedStatusFilter(pill.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold select-none cursor-pointer transition-all border ${
                isActive
                  ? isMyTasks
                    ? 'bg-cyan-500 border-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-100 border-slate-100 text-slate-950 font-bold'
                  : isMyTasks
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-100'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-3xl border border-slate-800 text-center text-slate-500">
          <HelpCircle className="w-10 h-10 mb-2 text-slate-700" />
          <p className="font-sans">დავალებები მოცემული ფილტრით ვერ მოიძებნა</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              allUsers={allUsers}
              onSelectOrder={onSelectOrder}
              highlight={selectedStatusFilter === 'my-tasks'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
