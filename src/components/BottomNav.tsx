import { User, hasModule, isAdminRole, isOwnerLike } from '../types';
import { LayoutDashboard, History, Users, BarChart3, Wrench, ListTodo, ShoppingBag, Settings, CalendarCheck, TrendingUp, Boxes } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
  currentUser: User;
}

export default function BottomNav({ currentTab, onChangeTab, currentUser }: BottomNavProps) {
  const { role } = currentUser;
  const tabs: { id: string; label: string; icon: any }[] = [];

  // The analyst (developer) can manage the whole program (incl. bootstrapping the owner)
  const canManage = isOwnerLike(role) || role === 'developer';

  if (isAdminRole(role)) {
    tabs.push({ id: 'dashboard', label: 'დაფა', icon: LayoutDashboard });
    tabs.push({ id: 'history', label: 'ისტორია', icon: History });
    if (canManage) {
      tabs.push({ id: 'employees', label: 'პერსონალი', icon: Users });
    }
    tabs.push({ id: 'boxes', label: 'ბოქსები', icon: Boxes });
    if (hasModule(currentUser, 'reports')) tabs.push({ id: 'reports', label: 'ანგარიში', icon: BarChart3 });
    if (hasModule(currentUser, 'shop')) tabs.push({ id: 'shop', label: 'მაღაზია', icon: ShoppingBag });
    if (hasModule(currentUser, 'day_closing')) tabs.push({ id: 'day-closing', label: 'დახურვა', icon: CalendarCheck });
    tabs.push({ id: 'earnings', label: 'ჩემი', icon: TrendingUp });
    if (canManage) {
      tabs.push({ id: 'settings', label: 'პარამეტრი', icon: Settings });
    }
  } else {
    tabs.push({ id: 'all-orders', label: 'დავალებები', icon: ListTodo });
    tabs.push({ id: 'mechanic-dashboard', label: 'ჩემი გვერდი', icon: Wrench });
    tabs.push({ id: 'history', label: 'ისტორია', icon: History });
    if (hasModule(currentUser, 'shop')) tabs.push({ id: 'shop', label: 'მაღაზია', icon: ShoppingBag });
    if (hasModule(currentUser, 'day_closing')) tabs.push({ id: 'day-closing', label: 'დახურვა', icon: CalendarCheck });
  }

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-800 text-slate-400 py-1 px-1 shadow-xl z-50">
      <div className="flex items-center justify-around max-w-3xl mx-auto overflow-x-auto scrollbar-none gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl transition-all select-none cursor-pointer min-w-[46px] flex-shrink-0 active:scale-95 ${
                isActive
                  ? 'text-amber-400 font-bold bg-amber-500/10'
                  : 'hover:text-slate-200 text-slate-400'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] font-medium tracking-tight text-center leading-tight whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
