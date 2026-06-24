import React, { useState, useEffect } from 'react';
import {
  CarServiceOrder, User, ServiceItem, OrderStatus, PaymentStatus,
  ServiceTypeConfig, calculateMechanicEarning, ROLE_LABELS,
  ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS,
} from '../types';
import { Wrench, User as UserIcon, Phone, Calendar, Plus, Trash2, Check, Edit, Save, ArrowLeft, Settings, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OrderDetailsViewProps {
  order: CarServiceOrder;
  services: ServiceItem[];
  mechanics: User[];
  allUsers: User[];
  currentUser: User;
  serviceConfigs: ServiceTypeConfig[];
  onSaveTransaction: (orderId: string, updatedOrder: CarServiceOrder, updatedServices: ServiceItem[]) => void;
  onBack: () => void;
  onDeleteOrder?: (orderId: string) => void;
}

export default function OrderDetailsView({
  order, services, mechanics, allUsers, currentUser, serviceConfigs, onSaveTransaction, onBack, onDeleteOrder,
}: OrderDetailsViewProps) {
  const isMechanic = currentUser.role === 'mechanic';
  const isAdminLike = currentUser.role === 'super_admin' || currentUser.role === 'admin' || currentUser.role === 'manager';

  const [draftOrder, setDraftOrder] = useState<CarServiceOrder>({ ...order });
  const [draftServices, setDraftServices] = useState<ServiceItem[]>(() =>
    services.filter(s => s.orderId === order.id)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setDraftOrder({ ...order });
    setDraftServices(services.filter(s => s.orderId === order.id));
  }, [order, services]);

  // Add service form
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const initialSrvType = serviceConfigs[0]?.id || 'diagnostic';
  const initialSrvCfg = serviceConfigs.find(c => c.id === initialSrvType);
  const initialMechId = currentUser.id || mechanics[0]?.id || '';
  const initialEmpCo = initialSrvCfg?.employeeRewards?.[initialMechId];
  const [serviceType, setServiceType] = useState<string>(initialSrvType);
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState<number | string>('');
  const [selectedMechanicId, setSelectedMechanicId] = useState(initialMechId);
  const [showCoMechanic, setShowCoMechanic] = useState(!!initialEmpCo?.coMechanicId);
  const [coMechanicId, setCoMechanicId] = useState(initialEmpCo?.coMechanicId || '');
  const [coMechanicEarning, setCoMechanicEarning] = useState<number | string>(initialEmpCo?.coMechanicEarning ?? '');
  const [serviceError, setServiceError] = useState('');

  // Admin edit form
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editBrand, setEditBrand] = useState(draftOrder.carBrand);
  const [editNumber, setEditNumber] = useState(draftOrder.carNumber);
  const [editClientName, setEditClientName] = useState(draftOrder.clientFullName);
  const [editPhone, setEditPhone] = useState(draftOrder.clientPhone);

  // Service inline edit
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [editSrvType, setEditSrvType] = useState('');
  const [editSrvDesc, setEditSrvDesc] = useState('');
  const [editSrvPriceValue, setEditSrvPriceValue] = useState<number | string>('');
  const [editSrvMechId, setEditSrvMechId] = useState('');
  const [editSrvCoMechId, setEditSrvCoMechId] = useState('');
  const [editSrvCoMechEarning, setEditSrvCoMechEarning] = useState<number | string>('');
  const [showEditCoMechanic, setShowEditCoMechanic] = useState(false);

  const isFlatService = (type: string) => serviceConfigs.find(c => c.id === type)?.rewardType === 'flat';

  const totalCost = draftServices.reduce((sum, s) => sum + s.price, 0);
  const totalMechEarnings = draftServices.reduce((sum, s) => sum + s.mechanicEarning + (s.coMechanicEarning || 0), 0);

  const getServiceLabel = (typeId: string) => serviceConfigs.find(c => c.id === typeId)?.name || typeId;

  const handleStartEditService = (srv: ServiceItem) => {
    setEditingSrvId(srv.id);
    setEditSrvType(srv.serviceType);
    setEditSrvDesc(srv.description);
    setEditSrvPriceValue(srv.price);
    setEditSrvMechId(srv.mechanicId);
    setEditSrvCoMechId(srv.coMechanicId || '');
    setEditSrvCoMechEarning(srv.coMechanicEarning ?? '');
    setShowEditCoMechanic(!!srv.coMechanicId);
  };

  const handleSaveEditServiceInline = () => {
    if (editSrvPriceValue === '' || Number(editSrvPriceValue) <= 0 || !editSrvDesc.trim()) {
      alert('გთხოვთ მიუთითოთ ვალიდური ფასი და აღწერა');
      return;
    }
    const earn = calculateMechanicEarning(editSrvType, Number(editSrvPriceValue), serviceConfigs, editSrvMechId);
    const hasCoMech = showEditCoMechanic && editSrvCoMechId && editSrvCoMechId !== editSrvMechId;
    setDraftServices(prev => prev.map(s => {
      if (s.id !== editingSrvId) return s;
      // Build without undefined — Firestore rejects undefined fields
      const { coMechanicId: _a, coMechanicEarning: _b, ...base } = s;
      return {
        ...base,
        serviceType: editSrvType,
        description: editSrvDesc.trim(),
        price: Number(editSrvPriceValue),
        mechanicId: editSrvMechId,
        mechanicEarning: earn,
        ...(hasCoMech ? { coMechanicId: editSrvCoMechId, coMechanicEarning: Number(editSrvCoMechEarning) || 0 } : {}),
      };
    }));
    setEditingSrvId(null);
  };

  const handleAddNewServiceToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setServiceError('');
    if (servicePrice === '' || Number(servicePrice) < 0) { setServiceError('ფასი სავალდებულოა'); return; }
    if (!serviceDescription.trim()) { setServiceError('სამუშაო აღწერა სავალდებულოა'); return; }
    if (!selectedMechanicId) { setServiceError('გთხოვთ აირჩიოთ შემსრულებელი'); return; }

    const earn = calculateMechanicEarning(serviceType, Number(servicePrice), serviceConfigs, selectedMechanicId);
    const hasCoMech = showCoMechanic && coMechanicId && coMechanicId !== selectedMechanicId;
    const newSrv: ServiceItem = {
      id: `srv-draft-${Date.now()}`,
      orderId: draftOrder.id,
      serviceType,
      description: serviceDescription.trim(),
      price: Number(servicePrice),
      mechanicId: selectedMechanicId,
      mechanicEarning: earn,
      ...(hasCoMech ? { coMechanicId: coMechanicId, coMechanicEarning: Number(coMechanicEarning) || 0 } : {}),
      createdAt: new Date().toISOString(),
    };
    setDraftServices(prev => [...prev, newSrv]);
    if (draftOrder.status === 'new') setDraftOrder(prev => ({ ...prev, status: 'pending' }));
    setServiceDescription('');
    setServicePrice('');
    setShowCoMechanic(false);
    setCoMechanicId('');
    setCoMechanicEarning('');
    setShowAddServiceForm(false);
  };

  const handleSaveAdminEditToDraft = () => {
    setDraftOrder(prev => ({
      ...prev,
      carBrand: editBrand,
      carNumber: editNumber.toUpperCase(),
      clientFullName: editClientName,
      clientPhone: editPhone,
    }));
    setIsEditingAdmin(false);
  };

  const paidToOptions = allUsers
    .filter(u => u.username !== 'imedo')
    .map(u => ({ id: u.id, label: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}` }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-5xl md:px-8">

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5" /> უკან
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">ID: {draftOrder.id.split('-')[1] || draftOrder.id}</span>
          {(currentUser.role === 'super_admin' || currentUser.role === 'manager') && onDeleteOrder && (
            <button
              onClick={() => { if (confirm('ნამდვილად წაიშალოს ეს დავალება? (ყველა სერვისი წაიშლება)')) onDeleteOrder(order.id); }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 bg-red-950/20 border border-red-500/20 px-2.5 py-1.5 rounded-xl cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> წაშლა
            </button>
          )}
        </div>
      </div>

      {/* Desktop 2-column layout */}
      <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">

        {/* LEFT column: order info + status */}
        <div className="space-y-5">
          {/* Main Order Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className={`absolute top-0 inset-x-0 h-1.5 ${draftOrder.status === 'new' ? 'bg-amber-500' : draftOrder.status === 'pending' ? 'bg-sky-500' : 'bg-green-500'}`} />

            {!isEditingAdmin ? (
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">ავტომობილი</span>
                    <h2 className="text-xl font-bold font-sans text-slate-50 uppercase tracking-tight">{draftOrder.carBrand}</h2>
                  </div>
                  <div className="bg-slate-950 border-2 border-slate-800 px-3 py-1.5 rounded-xl text-sm font-mono font-black tracking-widest text-slate-100">
                    {draftOrder.carNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-xs text-slate-300 border-t border-b border-slate-800 py-3.5 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold mb-0.5">კლიენტი</span>
                    <span className="font-semibold">{draftOrder.clientFullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold mb-0.5">ტელეფონი</span>
                    <a href={`tel:${draftOrder.clientPhone}`} className="text-amber-400 font-semibold underline">{draftOrder.clientPhone}</a>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold mb-0.5">თარიღი</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-slate-500" /> {draftOrder.date}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] text-slate-500 block uppercase font-bold tracking-wide mb-1">პრობლემის აღწერა:</label>
                  <textarea
                    value={draftOrder.problemDescription}
                    onChange={e => setDraftOrder(prev => ({ ...prev, problemDescription: e.target.value }))}
                    rows={3}
                    lang="ka"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50 placeholder-slate-600"
                    placeholder="შეიყვანეთ პრობლემის დეტალური აღწერა..."
                  />
                </div>

                {isAdminLike && (
                  <button
                    onClick={() => { setEditBrand(draftOrder.carBrand); setEditNumber(draftOrder.carNumber); setEditClientName(draftOrder.clientFullName); setEditPhone(draftOrder.clientPhone); setIsEditingAdmin(true); }}
                    className="w-full py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5">
                    <Settings className="w-3.5 h-3.5" /> მონაცემების რედაქტირება
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-amber-500 mb-1">ინფორმაციის განახლება</h3>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">მარკა და მოდელი</label>
                  <input type="text" value={editBrand} onChange={e => setEditBrand(e.target.value.toUpperCase())} lang="en"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">სახ. ნომერი</label>
                  <input type="text" value={editNumber} onChange={e => setEditNumber(e.target.value.toUpperCase())} lang="en"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono uppercase text-center" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">კლიენტი</label>
                  <input type="text" value={editClientName} onChange={e => setEditClientName(e.target.value)} lang="ka"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">ტელეფონი</label>
                  <input type="tel" inputMode="numeric" value={editPhone} onChange={e => setEditPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditingAdmin(false)}
                    className="py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-xs font-semibold cursor-pointer">გაუქმება</button>
                  <button type="button" onClick={handleSaveAdminEditToDraft}
                    className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold cursor-pointer">შენახვა</button>
                </div>
              </div>
            )}
          </div>

          {/* Status Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">შეკვეთის მართვა</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">სამუშაოს სტატუსი:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['new', 'pending', 'completed'] as OrderStatus[]).map(st => (
                    <button key={st} onClick={() => setDraftOrder(prev => ({ ...prev, status: st }))}
                      className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                        draftOrder.status === st
                          ? st === 'new' ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : st === 'pending' ? 'bg-sky-500 text-slate-950'
                            : 'bg-green-500 text-slate-950 font-black'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}>
                      {ORDER_STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="block text-[10px] text-slate-500 font-bold uppercase mb-1.5">
                  გადახდა {isMechanic && '(მხოლოდ ადმინი)'}:
                </span>
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {(['unpaid', 'paid'] as PaymentStatus[]).map(pay => (
                    <button key={pay} disabled={isMechanic}
                      onClick={() => setDraftOrder(prev => ({ ...prev, paymentStatus: pay, paidTo: pay === 'paid' ? prev.paidTo || paidToOptions[0]?.label || '' : undefined }))}
                      className={`py-2 text-[10px] font-bold rounded-lg transition-all ${isMechanic ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
                        draftOrder.paymentStatus === pay
                          ? pay === 'paid' ? 'bg-green-500 text-slate-950' : 'bg-rose-500 text-slate-100'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}>
                      {PAYMENT_STATUS_LABELS[pay]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {draftOrder.paymentStatus === 'paid' && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <label className="block text-[10px] text-amber-500 uppercase font-bold">ვისთან მოხდა გადახდა?</label>
                <select disabled={isMechanic} value={draftOrder.paidTo || paidToOptions[0]?.label || ''}
                  onChange={e => setDraftOrder(prev => ({ ...prev, paidTo: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50">
                  {paidToOptions.map(opt => <option key={opt.id} value={opt.label}>{opt.label}</option>)}
                </select>
              </motion.div>
            )}
          </div>

          {/* Assigned Employees (admin can change) */}
          {isAdminLike && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-cyan-400" /> მინიჭებული შემსრულებლები
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {allUsers.filter(u => u.username !== 'imedo').map(u => {
                  const assigned = (draftOrder.assignedEmployeeIds || []).includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        const cur = draftOrder.assignedEmployeeIds || [];
                        const next = assigned ? cur.filter(id => id !== u.id) : [...cur, u.id];
                        setDraftOrder(prev => ({ ...prev, assignedEmployeeIds: next.length > 0 ? next : undefined }));
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                        assigned
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${assigned ? 'bg-cyan-400' : 'bg-slate-700'}`} />
                      <span className="text-xs font-semibold truncate">{u.firstName} {u.lastName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save button — visible on desktop in left column */}
          <div className="hidden md:block space-y-2">
            {saveError && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
                {saveError}
              </div>
            )}
            <button
              disabled={saving}
              onClick={async () => {
                if (saving) return;
                setSaving(true); setSaveError('');
                try { await onSaveTransaction(order.id, draftOrder, draftServices); }
                catch (e: any) { setSaveError('შენახვა ვერ მოხერხდა. სცადეთ თავიდან.'); }
                finally { setSaving(false); }
              }}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-xl uppercase tracking-widest cursor-pointer active:scale-95 hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving
                ? <><div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> შენახვა...</>
                : <><Save className="w-4 h-4 stroke-[2.5]" /> ყველა ცვლილების შენახვა</>}
            </button>
          </div>
        </div>

        {/* RIGHT column: services */}
        <div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg mb-5">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/85 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-100">მომსახურებების სია</h3>
                <span className="text-[10px] text-slate-500">ცვლილებები ძალაში შევა შენახვისას</span>
              </div>
              <button onClick={() => setShowAddServiceForm(!showAddServiceForm)}
                className="flex items-center gap-1 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer">
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> დამატება
              </button>
            </div>

            <AnimatePresence>
              {showAddServiceForm && (
                <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddNewServiceToDraft}
                  className="mb-4 bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-3 overflow-hidden">
                  <h4 className="text-xs font-bold text-amber-500 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> მომსახურების ჩაწერა
                  </h4>
                  {serviceError && <div className="p-2 bg-red-950/40 border border-red-500/20 text-red-500 text-[11px] rounded-lg">{serviceError}</div>}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">ტიპი</label>
                      <select value={serviceType} onChange={e => {
                        const t = e.target.value;
                        setServiceType(t);
                        const cfg = serviceConfigs.find(c => c.id === t);
                        const empCo = cfg?.employeeRewards?.[selectedMechanicId];
                        const coId = empCo?.coMechanicId;
                        if (coId) {
                          const earning = empCo!.coMechanicRewardType === 'percentage'
                            ? Number(servicePrice) > 0 ? +((Number(servicePrice) * (empCo!.coMechanicEarning ?? 0)) / 100).toFixed(2) : ''
                            : (empCo!.coMechanicEarning ?? '');
                          setCoMechanicId(coId);
                          setCoMechanicEarning(earning);
                          setShowCoMechanic(true);
                        } else {
                          setShowCoMechanic(false);
                          setCoMechanicId('');
                          setCoMechanicEarning('');
                        }
                      }}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                        {serviceConfigs.map(cfg => <option key={cfg.id} value={cfg.id}>{cfg.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">ფასი (₾) *</label>
                      <input type="number" value={servicePrice} onChange={e => {
                        const newPrice = e.target.value;
                        setServicePrice(newPrice);
                        // Recalculate co-mechanic earning if percentage type
                        if (showCoMechanic && coMechanicId) {
                          const cfg = serviceConfigs.find(c => c.id === serviceType);
                          const empCo = cfg?.employeeRewards?.[selectedMechanicId];
                          if (empCo?.coMechanicRewardType === 'percentage' && empCo.coMechanicEarning != null) {
                            const p = parseFloat(newPrice) || 0;
                            setCoMechanicEarning(p > 0 ? +((p * empCo.coMechanicEarning) / 100).toFixed(2) : '');
                          }
                        }
                      }}
                        placeholder="შეიყვანეთ ფასი"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2 border border-slate-800/60 rounded-lg text-[10.5px] text-slate-400">
                    <span className="font-semibold block mb-0.5 text-slate-300">შემსრულებლის შემოსავალი:</span>
                    {(() => {
                      const conf = serviceConfigs.find(c => c.id === serviceType);
                      if (!conf) return <p>50%</p>;
                      const empR = conf.employeeRewards?.[selectedMechanicId];
                      const active = empR || conf;
                      if (active.rewardType === 'flat') {
                        return <p>ფიქსირებული: <span className="text-emerald-400 font-bold">{(empR || conf).flatReward} ₾</span></p>;
                      } else {
                        const pct = (empR || conf).percentageReward;
                        const earn = Number(servicePrice) > 0 ? (Number(servicePrice) * pct) / 100 : 0;
                        return <p>{pct}% = <span className="text-emerald-400 font-bold">{earn.toFixed(1)} ₾</span></p>;
                      }
                    })()}
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">შემსრულებელი *</label>
                    <select value={selectedMechanicId} onChange={e => {
                        const newMechId = e.target.value;
                        setSelectedMechanicId(newMechId);
                        const cfg = serviceConfigs.find(c => c.id === serviceType);
                        const empCo = cfg?.employeeRewards?.[newMechId];
                        if (empCo?.coMechanicId) {
                          const earning = empCo.coMechanicRewardType === 'percentage'
                            ? Number(servicePrice) > 0 ? +((Number(servicePrice) * (empCo.coMechanicEarning ?? 0)) / 100).toFixed(2) : ''
                            : (empCo.coMechanicEarning ?? '');
                          setCoMechanicId(empCo.coMechanicId);
                          setCoMechanicEarning(earning);
                          setShowCoMechanic(true);
                        } else {
                          setShowCoMechanic(false);
                          setCoMechanicId('');
                          setCoMechanicEarning('');
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                      {mechanics.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>

                  {/* Co-executor (available for all service types) */}
                  <div className="border border-slate-700/50 rounded-xl p-2.5 space-y-2 bg-slate-900/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">მეორე შემსრულებელი (არჩევითი)</span>
                      <button type="button"
                        onClick={() => { setShowCoMechanic(!showCoMechanic); if (showCoMechanic) { setCoMechanicId(''); setCoMechanicEarning(''); } }}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all ${showCoMechanic ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                        {showCoMechanic ? <><X className="w-3 h-3" /> გაუქმება</> : <><UserPlus className="w-3 h-3" /> დამატება</>}
                      </button>
                    </div>
                    {showCoMechanic && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">შემსრულებელი</label>
                          <select value={coMechanicId} onChange={e => setCoMechanicId(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200">
                            <option value="">— აირჩიეთ —</option>
                            {mechanics.filter(m => m.id !== selectedMechanicId).map(m => (
                              <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-0.5">
                            დასარიცხი (₾)
                            {serviceConfigs.find(c => c.id === serviceType)?.coMechanicRewardType === 'percentage' && (
                              <span className="ml-1 text-cyan-400">({serviceConfigs.find(c => c.id === serviceType)?.coMechanicEarning}% კონფ.)</span>
                            )}
                          </label>
                          <input type="number" value={coMechanicEarning} onChange={e => setCoMechanicEarning(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">მომსახურების აღწერა *</label>
                    <input type="text" value={serviceDescription} onChange={e => setServiceDescription(e.target.value)}
                      placeholder="მაგ: კოჭის შეცვლა, ძრავის გარეცხვა..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-100 placeholder-slate-600" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button type="button" onClick={() => setShowAddServiceForm(false)}
                      className="py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg cursor-pointer">გაუქმება</button>
                    <button type="submit"
                      className="py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1">
                      <Plus className="w-3.5 h-3.5" /> დამატება
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {draftServices.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">მომსახურებები ჯერ არ არის ჩაწერილი.</div>
            ) : (
              <div className="space-y-3">
                {draftServices.map(srv => {
                  const isEditingThis = editingSrvId === srv.id;
                  const mechObj = allUsers.find(m => m.id === srv.mechanicId) || { firstName: 'უცნობი', lastName: '' };
                  const coMechObj = srv.coMechanicId ? allUsers.find(m => m.id === srv.coMechanicId) : null;
                  return (
                    <div key={srv.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl space-y-3">
                      {isEditingThis ? (
                        <div className="space-y-2 text-xs">
                          <h4 className="text-[11px] font-bold text-amber-500 uppercase">მომსახურების შესწორება</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">ტიპი</label>
                              <select value={editSrvType} onChange={e => {
                                const t = e.target.value;
                                setEditSrvType(t);
                                const cfg = serviceConfigs.find(c => c.id === t);
                                if (cfg?.coMechanicId) {
                                  setEditSrvCoMechId(cfg.coMechanicId);
                                  setEditSrvCoMechEarning(cfg.coMechanicEarning ?? '');
                                  setShowEditCoMechanic(true);
                                } else {
                                  setShowEditCoMechanic(false);
                                  setEditSrvCoMechId('');
                                  setEditSrvCoMechEarning('');
                                }
                              }}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200">
                                {serviceConfigs.map(cfg => <option key={cfg.id} value={cfg.id}>{cfg.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-0.5">ფასი (₾)</label>
                              <input type="number" value={editSrvPriceValue} onChange={e => setEditSrvPriceValue(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 font-mono text-center" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">პირველი შემსრულებელი</label>
                            <select value={editSrvMechId} onChange={e => setEditSrvMechId(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200">
                              {allUsers.filter(u => u.username !== 'imedo').map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                            </select>
                          </div>

                          {/* Co-executor edit section (all service types) */}
                          <div className="border border-slate-700/50 rounded-xl p-2.5 space-y-2 bg-slate-900/50">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">მეორე შემსრულებელი</span>
                              <button type="button"
                                onClick={() => { setShowEditCoMechanic(!showEditCoMechanic); if (showEditCoMechanic) { setEditSrvCoMechId(''); setEditSrvCoMechEarning(''); } }}
                                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer transition-all ${showEditCoMechanic ? 'bg-rose-500/20 text-rose-400 border border-rose-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
                                {showEditCoMechanic ? <><X className="w-3 h-3" /> გაუქმება</> : <><UserPlus className="w-3 h-3" /> დამატება</>}
                              </button>
                            </div>
                            {showEditCoMechanic && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-0.5">შემსრულებელი</label>
                                  <select value={editSrvCoMechId} onChange={e => setEditSrvCoMechId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200">
                                    <option value="">— აირჩიეთ —</option>
                                    {allUsers.filter(u => u.username !== 'imedo' && u.id !== editSrvMechId).map(u => (
                                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] text-slate-500 mb-0.5">დასარიცხი (₾)</label>
                                  <input type="number" value={editSrvCoMechEarning} onChange={e => setEditSrvCoMechEarning(e.target.value)}
                                    placeholder="0"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 font-mono" />
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-500 mb-0.5">აღწერა</label>
                            <input type="text" value={editSrvDesc} onChange={e => setEditSrvDesc(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1.5">
                            <button onClick={() => setEditingSrvId(null)} className="py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-[10px] font-bold rounded-lg cursor-pointer">გაუქმება</button>
                            <button onClick={handleSaveEditServiceInline} className="py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-lg cursor-pointer flex items-center justify-center gap-1">
                              <Check className="w-3.5 h-3.5" /> შენახვა
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-amber-500 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Wrench className="w-3 h-3" /> {getServiceLabel(srv.serviceType)}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                შემსრულებელი: <b className="text-slate-400">{mechObj.firstName} {(mechObj as any).lastName}</b>
                              </span>
                              {coMechObj && (
                                <span className="text-[10px] text-slate-500">
                                  + <b className="text-slate-400">{coMechObj.firstName} {coMechObj.lastName}</b>
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-200 font-medium pl-0.5">{srv.description}</p>
                            <div className="text-[10.5px] text-slate-400 flex flex-wrap items-center gap-2">
                              <span>ფასი: <b className="text-slate-100 font-mono">{srv.price} ₾</b></span>
                              <span className="text-slate-600">|</span>
                              <span>
                                {mechObj.firstName}: <b className="text-cyan-400 font-mono">{srv.mechanicEarning} ₾</b>
                              </span>
                              {coMechObj && srv.coMechanicEarning !== undefined && (
                                <>
                                  <span className="text-slate-600">|</span>
                                  <span>
                                    {coMechObj.firstName}: <b className="text-cyan-400 font-mono">{srv.coMechanicEarning} ₾</b>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {!isMechanic && (
                              <button onClick={() => handleStartEditService(srv)}
                                className="p-2 border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-xl cursor-pointer">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button onClick={() => { if (confirm('წაიშალოს მომსახურება?')) setDraftServices(prev => prev.filter(s => s.id !== srv.id)); }}
                              className="p-2 border border-red-500/20 bg-red-950/20 text-red-400 hover:text-red-300 rounded-xl cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 mt-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>ჯამური ღირებულება:</span>
                    <span className="text-slate-100 font-mono font-extrabold text-sm">{totalCost} ₾</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>შემსრულებლების ჯამური გამომუშავება:</span>
                    <span className="text-cyan-400 font-mono font-extrabold text-sm">{totalMechEarnings} ₾</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Button — mobile only (desktop version is in left column) */}
      <div className="pt-2 pb-6 md:hidden space-y-2">
        {saveError && (
          <div className="p-2.5 bg-red-950/40 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {saveError}
          </div>
        )}
        <button
          disabled={saving}
          onClick={async () => {
            if (saving) return;
            setSaving(true); setSaveError('');
            try { await onSaveTransaction(order.id, draftOrder, draftServices); }
            catch (e: any) { setSaveError('შენახვა ვერ მოხერხდა. სცადეთ თავიდან.'); }
            finally { setSaving(false); }
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-2xl shadow-xl uppercase tracking-widest cursor-pointer active:scale-[0.98] hover:from-amber-400 hover:to-amber-500 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving
            ? <><div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> შენახვა...</>
            : <><Save className="w-4 h-4 stroke-[2.5]" /> ყველა ცვლილების შენახვა</>}
        </button>
      </div>
    </motion.div>
  );
}
