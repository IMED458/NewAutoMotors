import React, { useState, useRef, useEffect } from 'react';
import { CarServiceOrder, OrderStatus, PaymentStatus, CarBrand, User, Box, ClientSource, mechanicIdsForManager } from '../types';
import { Calendar, Car, User as UserIcon, Phone, Plus, FileText, CheckCircle, ChevronDown, Wrench, UserCheck, Boxes } from 'lucide-react';
import { motion } from 'motion/react';

interface OrderFormViewProps {
  carBrands: CarBrand[];
  allUsers: User[];
  boxes: Box[];
  currentUser: User;
  serviceTypeNames: { id: string; name: string }[];
  onAddOrder: (order: Omit<CarServiceOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  onCancel: () => void;
}

function formatPlate(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  return `${clean.slice(0, 2)}-${clean.slice(2, 5)}-${clean.slice(5)}`;
}

export default function OrderFormView({ carBrands, allUsers, boxes, currentUser, serviceTypeNames, onAddOrder, onCancel }: OrderFormViewProps) {
  const todayStr = new Date().toISOString().substring(0, 10);

  const isMechanicUser = currentUser.role === 'mechanic';
  const isServiceManagerUser = currentUser.role === 'service_manager';

  // Box that the current mechanic belongs to (to prefill manager/box)
  const myMechanicBox = boxes.find(b => (b.mechanicIds || []).includes(currentUser.id));
  // Boxes a service manager owns
  const myManagedBoxes = boxes.filter(b => b.serviceManagerId === currentUser.id);

  const defaultClientSource: ClientSource = isMechanicUser ? 'mechanic' : 'service';
  const defaultBoxId = isMechanicUser
    ? (myMechanicBox?.id || '')
    : isServiceManagerUser
    ? (myManagedBoxes[0]?.id || '')
    : '';

  const [clientSource, setClientSource] = useState<ClientSource>(defaultClientSource);
  const [boxId, setBoxId] = useState<string>(defaultBoxId);

  const [date, setDate] = useState(todayStr);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [carNumber, setCarNumber] = useState('');
  const [clientFullName, setClientFullName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [status, setStatus] = useState<OrderStatus>('new');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [assignedEmployeeIds, setAssignedEmployeeIds] = useState<string[]>([]);
  const [assignedServiceType, setAssignedServiceType] = useState('');
  const [saving, setSaving] = useState(false);

  const brandRef = useRef<HTMLDivElement>(null);

  // Mechanics (and service managers) can be assigned to do work.
  // A service manager sees their own box mechanics first, but can assign anyone (#2).
  const myMechanicIds = isServiceManagerUser
    ? mechanicIdsForManager(boxes, currentUser.id)
    : (boxes.find(b => b.id === boxId)?.mechanicIds || []);
  const assignableUsers = allUsers
    .filter(u => (u.role === 'mechanic' || u.role === 'service_manager') && u.username !== 'imedo')
    .sort((a, b) => Number(myMechanicIds.includes(b.id)) - Number(myMechanicIds.includes(a.id)));

  const filteredBrands = carBrands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleEmployee = (id: string) => {
    setAssignedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const brand = selectedBrand || brandSearch.trim().toUpperCase();
      const carBrandFull = carModel.trim() ? `${brand} ${carModel.trim().toUpperCase()}` : brand;
      const selectedBox = boxes.find(b => b.id === boxId);
      const serviceManagerId = isServiceManagerUser ? currentUser.id : selectedBox?.serviceManagerId;
      // A mechanic who registers a car is also assigned to it
      const finalAssigned = isMechanicUser && !assignedEmployeeIds.includes(currentUser.id)
        ? [currentUser.id, ...assignedEmployeeIds]
        : assignedEmployeeIds;
      await onAddOrder({
        date: date || todayStr,
        carBrand: carBrandFull || 'არაა მითითებული',
        carNumber: carNumber.trim() || 'არაა მითითებული',
        clientFullName: clientFullName.trim() || 'არაა მითითებული',
        clientPhone: clientPhone.trim() || 'არაა მითითებული',
        problemDescription: problemDescription.trim() || 'არაა აღწერილი',
        status,
        paymentStatus,
        clientSource,
        ...(boxId ? { boxId } : {}),
        ...(serviceManagerId ? { serviceManagerId } : {}),
        ...(finalAssigned.length > 0 ? { assignedEmployeeIds: finalAssigned } : {}),
        ...(assignedServiceType ? { assignedServiceType } : {}),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold tracking-tight text-slate-50 flex items-center gap-2">
          <span className="bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-amber-500/20">
            <Plus className="w-5 h-5" />
          </span>
          ახალი მანქანის რეგისტრაცია
        </h2>
        <button onClick={onCancel} className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl">
          უკან
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" /> მიღების თარიღი
          </label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60" />
        </div>

        {/* Car Brand (searchable dropdown) */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" /> მანქანის მარკა
            <span className="ml-auto text-[10px] text-amber-500/70 font-mono">EN</span>
          </label>
          <div ref={brandRef} className="relative">
            <div
              onClick={() => setShowBrandDropdown(true)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus-within:border-amber-500/60 flex items-center justify-between cursor-pointer"
            >
              <input
                type="text"
                value={selectedBrand || brandSearch}
                onChange={e => { setBrandSearch(e.target.value.toUpperCase()); setSelectedBrand(''); setShowBrandDropdown(true); }}
                onFocus={() => setShowBrandDropdown(true)}
                placeholder="მარკის ძებნა... (მაგ: VOLVO)"
                lang="en"
                autoCapitalize="characters"
                className="bg-transparent outline-none flex-1 placeholder-slate-600 text-slate-200 min-w-0"
              />
              <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
            {showBrandDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto">
                {filteredBrands.length === 0 ? (
                  <p className="text-slate-500 text-xs p-3">არ მოიძებნა</p>
                ) : filteredBrands.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => { setSelectedBrand(b.name); setBrandSearch(''); setShowBrandDropdown(false); }}
                    className="w-full text-left px-3 py-2.5 font-mono font-bold text-slate-200 hover:bg-amber-500/10 hover:text-amber-400 transition-colors"
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Car Model */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" /> მოდელი / სახეობა
            <span className="ml-auto text-[10px] text-amber-500/70 font-mono">EN</span>
          </label>
          <input
            type="text"
            value={carModel}
            onChange={e => setCarModel(e.target.value)}
            placeholder="მაგ: ACTROS, FH16, TGX (სურვილისამებრ)"
            lang="en"
            autoCapitalize="characters"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600 uppercase"
          />
        </div>

        {/* Car Plate */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" /> სახელმწიფო ნომერი
            <span className="ml-1 text-[10px] text-slate-500">XX-000-XX</span>
            <span className="ml-auto text-[10px] text-amber-500/70 font-mono">EN</span>
          </label>
          <input
            type="text"
            value={carNumber}
            onChange={e => setCarNumber(formatPlate(e.target.value))}
            placeholder="მაგ: GE-777-AA"
            lang="en"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={9}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 uppercase text-slate-200 font-mono tracking-widest focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
        </div>

        {/* Client Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5 text-slate-500" /> კლიენტის სახელი და გვარი
          </label>
          <input
            type="text"
            value={clientFullName}
            onChange={e => setClientFullName(e.target.value)}
            placeholder="მაგ: გიორგი იაშვილი"
            lang="ka"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" /> კლიენტის ტელეფონი
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={clientPhone}
            onChange={e => setClientPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="მაგ: 599123456"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600 font-mono"
          />
        </div>

        {/* Problem */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1">პრობლემის პირველადი აღწერა</label>
          <textarea
            value={problemDescription}
            onChange={e => setProblemDescription(e.target.value)}
            placeholder="რა პრობლემა აქვს ავტომობილს..."
            rows={3}
            lang="ka"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60 placeholder-slate-600 resize-none"
          />
        </div>

        {/* Box selection */}
        {boxes.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-slate-500" /> ბოქსი
            </label>
            <select value={boxId} onChange={e => setBoxId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60">
              <option value="">— ბოქსის გარეშე —</option>
              {(isServiceManagerUser ? boxes.filter(b => b.serviceManagerId === currentUser.id) : boxes).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              {isServiceManagerUser && boxes.some(b => b.serviceManagerId !== currentUser.id) && (
                <optgroup label="სხვა ბოქსები">
                  {boxes.filter(b => b.serviceManagerId !== currentUser.id).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        )}

        {/* Client source — drives the revenue split */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <label className="block text-xs font-bold text-slate-300">კლიენტი ვინ მოიყვანა?</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setClientSource('mechanic')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${clientSource === 'mechanic' ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              ხელოსანმა მოიყვანა
            </button>
            <button type="button" onClick={() => setClientSource('service')}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${clientSource === 'service' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              სერვისმა მოიყვანა
            </button>
          </div>
          <p className="text-[10px] text-slate-500">ეს განსაზღვრავს ხელოსნისა და სერვის მენეჯერის პროცენტს. შეცვლა ფინანსებშიც შესაძლებელია.</p>
        </div>

        {/* Employee Assignment */}
        {assignableUsers.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              თანამშრომლის მინიჭება (სურვილისამებრ)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {assignableUsers.map(u => {
                const isSelected = assignedEmployeeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleEmployee(u.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isSelected ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                    <span className="text-xs font-semibold truncate">{u.firstName} {u.lastName}</span>
                  </button>
                );
              })}
            </div>

            {assignedEmployeeIds.length > 0 && serviceTypeNames.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">სამუშაოს ტიპი (სურვილისამებრ)</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAssignedServiceType('')}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${!assignedServiceType ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    ნებისმიერი
                  </button>
                  {serviceTypeNames.map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setAssignedServiceType(st.id)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${assignedServiceType === st.id ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">სამუშაო სტატუსი</label>
            <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60">
              <option value="new">ახალი (მიღებული)</option>
              <option value="pending">პროცესშია</option>
              <option value="completed">დასრულებულია</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">გადახდის სტატუსი</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/60">
              <option value="unpaid">გადაუხდელია</option>
              <option value="paid">გადახდილია</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3">
          <button type="button" onClick={onCancel}
            className="w-full py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl cursor-pointer">
            გაუქმება
          </button>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> შენახვა...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> დარეგისტრირება</>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
