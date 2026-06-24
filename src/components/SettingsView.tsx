import React, { useState } from 'react';
import { ServiceTypeConfig, CarBrand, User, DEFAULT_CAR_BRANDS, RevenueShareConfig } from '../types';
import { Plus, Edit, Trash, Save, X, Settings, Car, Wrench, UserPlus, Check, Percent } from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  serviceConfigs: ServiceTypeConfig[];
  carBrands: CarBrand[];
  users: User[];
  currentUser: User;
  revenueShare: RevenueShareConfig;
  onSaveServiceConfigs: (configs: ServiceTypeConfig[]) => void;
  onSaveCarBrands: (brands: CarBrand[]) => void;
  onSaveRevenueShare: (cfg: RevenueShareConfig) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
}

type SubTab = 'services' | 'brands' | 'revenue';

export default function SettingsView({
  serviceConfigs, carBrands, users, currentUser, revenueShare,
  onSaveServiceConfigs, onSaveCarBrands, onSaveRevenueShare,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<SubTab>('services');

  // Revenue-share editing (#3) — local draft of the four percentages
  const [rsMechMech, setRsMechMech] = useState(revenueShare.mechanicSourced.mechanicPct);
  const [rsMechMgr, setRsMechMgr] = useState(revenueShare.mechanicSourced.serviceManagerPct);
  const [rsSvcMech, setRsSvcMech] = useState(revenueShare.serviceSourced.mechanicPct);
  const [rsSvcMgr, setRsSvcMgr] = useState(revenueShare.serviceSourced.serviceManagerPct);
  const saveRevenue = () => {
    onSaveRevenueShare({
      id: 'global',
      mechanicSourced: { mechanicPct: Number(rsMechMech) || 0, serviceManagerPct: Number(rsMechMgr) || 0 },
      serviceSourced: { mechanicPct: Number(rsSvcMech) || 0, serviceManagerPct: Number(rsSvcMgr) || 0 },
    });
    setSuccess('პროცენტები შენახულია!');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Service configs state
  const [showAddSrv, setShowAddSrv] = useState(false);
  const [newSrvName, setNewSrvName] = useState('');
  const [newSrvRewardType, setNewSrvRewardType] = useState<'percentage' | 'flat'>('percentage');
  const [newSrvPct, setNewSrvPct] = useState(50);
  const [newSrvFlat, setNewSrvFlat] = useState(30);
  const [editingCfgId, setEditingCfgId] = useState<string | null>(null);
  const [editSrvName, setEditSrvName] = useState('');
  const [editSrvRewardType, setEditSrvRewardType] = useState<'percentage' | 'flat'>('percentage');
  const [editSrvPct, setEditSrvPct] = useState(50);
  const [editSrvFlat, setEditSrvFlat] = useState(30);
  // Per-employee reward editing
  const [expandedCfgId, setExpandedCfgId] = useState<string | null>(null);
  const [empEditId, setEmpEditId] = useState<string | null>(null);
  const [empRewardType, setEmpRewardType] = useState<'percentage' | 'flat'>('percentage');
  const [empPct, setEmpPct] = useState(50);
  const [empFlat, setEmpFlat] = useState(30);

  // Per-employee co-mechanic editing
  const [empCoMechEditKey, setEmpCoMechEditKey] = useState<string | null>(null);
  const [empCoMechUserId, setEmpCoMechUserId] = useState('');
  const [empCoMechRewardType, setEmpCoMechRewardType] = useState<'flat' | 'percentage'>('flat');
  const [empCoMechEarning, setEmpCoMechEarning] = useState<number | string>('');

  // Car brands state
  const [newBrandName, setNewBrandName] = useState('');
  const [success, setSuccess] = useState('');

  const mechanics = users.filter(u => u.username !== 'imedo');

  const handleAddSrv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvName.trim()) return;
    const id = `srv-config-${Date.now()}`;
    const cfg: ServiceTypeConfig = {
      id,
      name: newSrvName.trim(),
      rewardType: newSrvRewardType,
      percentageReward: newSrvRewardType === 'percentage' ? newSrvPct : 0,
      flatReward: newSrvRewardType === 'flat' ? newSrvFlat : 0,
    };
    onSaveServiceConfigs([...serviceConfigs, cfg]);
    setNewSrvName(''); setShowAddSrv(false);
    setSuccess('სერვისი დაემატა!');
  };

  const handleStartEditCfg = (cfg: ServiceTypeConfig) => {
    setEditingCfgId(cfg.id);
    setEditSrvName(cfg.name);
    setEditSrvRewardType(cfg.rewardType);
    setEditSrvPct(cfg.percentageReward);
    setEditSrvFlat(cfg.flatReward);
  };

  const handleSaveEditCfg = () => {
    const updated = serviceConfigs.map(c => c.id === editingCfgId ? {
      ...c, name: editSrvName.trim(), rewardType: editSrvRewardType,
      percentageReward: editSrvRewardType === 'percentage' ? editSrvPct : 0,
      flatReward: editSrvRewardType === 'flat' ? editSrvFlat : 0,
    } : c);
    onSaveServiceConfigs(updated);
    setEditingCfgId(null);
    setSuccess('შენახულია!');
  };

  const handleDeleteCfg = (id: string) => {
    if (confirm('წაიშალოს?')) {
      onSaveServiceConfigs(serviceConfigs.filter(c => c.id !== id));
    }
  };

  const startEditEmpReward = (cfg: ServiceTypeConfig, empId: string) => {
    setEmpEditId(`${cfg.id}:${empId}`);
    const er = cfg.employeeRewards?.[empId];
    setEmpRewardType(er?.rewardType || cfg.rewardType);
    setEmpPct(er?.percentageReward ?? cfg.percentageReward);
    setEmpFlat(er?.flatReward ?? cfg.flatReward);
  };

  const saveEmpReward = (cfgId: string, empId: string) => {
    const updated = serviceConfigs.map(c => c.id === cfgId ? {
      ...c,
      employeeRewards: {
        ...(c.employeeRewards || {}),
        [empId]: { rewardType: empRewardType, percentageReward: empRewardType === 'percentage' ? empPct : 0, flatReward: empRewardType === 'flat' ? empFlat : 0 },
      },
    } : c);
    onSaveServiceConfigs(updated);
    setEmpEditId(null);
    setSuccess('შენახულია!');
  };

  const removeEmpReward = (cfgId: string, empId: string) => {
    const updated = serviceConfigs.map(c => {
      if (c.id !== cfgId) return c;
      const { [empId]: _, ...rest } = c.employeeRewards || {};
      return { ...c, employeeRewards: rest };
    });
    onSaveServiceConfigs(updated);
  };

  const saveEmpCoMech = (cfgId: string, empId: string) => {
    const updated = serviceConfigs.map(c => {
      if (c.id !== cfgId) return c;
      const existing = c.employeeRewards?.[empId] || { rewardType: c.rewardType, percentageReward: c.percentageReward, flatReward: c.flatReward };
      return {
        ...c,
        employeeRewards: {
          ...(c.employeeRewards || {}),
          [empId]: empCoMechUserId ? {
            ...existing,
            coMechanicId: empCoMechUserId,
            coMechanicRewardType: empCoMechRewardType,
            coMechanicEarning: Number(empCoMechEarning) || 0,
          } : { ...existing },
        },
      };
    });
    onSaveServiceConfigs(updated);
    setEmpCoMechEditKey(null);
    setSuccess('შენახულია!');
  };

  const removeEmpCoMech = (cfgId: string, empId: string) => {
    const updated = serviceConfigs.map(c => {
      if (c.id !== cfgId) return c;
      const empR = c.employeeRewards?.[empId];
      if (!empR) return c;
      const { coMechanicId: _a, coMechanicRewardType: _b, coMechanicEarning: _c, ...rest } = empR as any;
      return { ...c, employeeRewards: { ...(c.employeeRewards || {}), [empId]: rest } };
    });
    onSaveServiceConfigs(updated);
    setSuccess('წაიშალა!');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrandName.trim().toUpperCase();
    if (!name || carBrands.find(b => b.name === name)) return;
    const id = `cb-${Date.now()}`;
    onSaveCarBrands([...carBrands, { id, name }]);
    setNewBrandName('');
    setSuccess('მარკა დაემატა!');
  };

  const handleDeleteBrand = (id: string) => {
    onSaveCarBrands(carBrands.filter(b => b.id !== id));
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl mb-5">
        <button onClick={() => setActiveTab('services')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${activeTab === 'services' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
          <Wrench className="w-4 h-4" /> სერვისები
        </button>
        <button onClick={() => setActiveTab('brands')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${activeTab === 'brands' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
          <Car className="w-4 h-4" /> მარკები
        </button>
        <button onClick={() => setActiveTab('revenue')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex justify-center items-center gap-1.5 ${activeTab === 'revenue' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
          <Percent className="w-4 h-4" /> პროცენტები
        </button>
      </div>

      {success && <div className="p-3 bg-green-950/40 border border-green-500/20 text-green-400 text-xs rounded-xl mb-4" onClick={() => setSuccess('')}>{success}</div>}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-300">მომსახურების ტიპები</h3>
              <p className="text-[10px] text-slate-500">თითოეულ თანამშრომელზე განსხვავებული განაწილება</p>
            </div>
            <button onClick={() => setShowAddSrv(!showAddSrv)}
              className="flex items-center gap-1 text-[11px] text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-1.5 rounded-xl cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> {showAddSrv ? 'დახურვა' : 'დამატება'}
            </button>
          </div>

          {showAddSrv && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-amber-500">ახალი სერვისის ტიპი</h4>
              <form onSubmit={handleAddSrv} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">სახელი *</label>
                  <input value={newSrvName} onChange={e => setNewSrvName(e.target.value)} placeholder="მაგ: ძრავის ხელობა"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">ანაზღაურების ტიპი</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-xl mb-2">
                    <button type="button" onClick={() => setNewSrvRewardType('percentage')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${newSrvRewardType === 'percentage' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                      პროცენტული (%)
                    </button>
                    <button type="button" onClick={() => setNewSrvRewardType('flat')}
                      className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer ${newSrvRewardType === 'flat' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>
                      ფიქსირებული (₾)
                    </button>
                  </div>
                  {newSrvRewardType === 'percentage' ? (
                    <input type="number" value={newSrvPct} onChange={e => setNewSrvPct(Number(e.target.value))} placeholder="პროცენტი %"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none" />
                  ) : (
                    <input type="number" value={newSrvFlat} onChange={e => setNewSrvFlat(Number(e.target.value))} placeholder="ლარი ₾"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none" />
                  )}
                </div>
                <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer">
                  შექმნა
                </button>
              </form>
            </motion.div>
          )}

          <div className="space-y-3">
            {serviceConfigs.map(cfg => (
              <div key={cfg.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
                {editingCfgId === cfg.id ? (
                  <div className="space-y-2 text-xs">
                    <input value={editSrvName} onChange={e => setEditSrvName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editSrvRewardType} onChange={e => setEditSrvRewardType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-slate-200">
                        <option value="percentage">პროცენტული</option>
                        <option value="flat">ფიქსირებული</option>
                      </select>
                      {editSrvRewardType === 'percentage' ? (
                        <input type="number" value={editSrvPct} onChange={e => setEditSrvPct(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-200 text-center" />
                      ) : (
                        <input type="number" value={editSrvFlat} onChange={e => setEditSrvFlat(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-slate-200 text-center" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setEditingCfgId(null)} className="py-1.5 bg-slate-950 border border-slate-800 text-slate-400 text-[11px] font-bold rounded-lg cursor-pointer">გაუქმება</button>
                      <button onClick={handleSaveEditCfg} className="py-1.5 bg-amber-500 text-slate-950 text-[11px] font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1">
                        <Save className="w-3 h-3" /> შენახვა
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{cfg.name}</h4>
                        <div className="text-xs text-slate-500 mt-1">
                          default: <b className="text-cyan-400">{cfg.rewardType === 'flat' ? `${cfg.flatReward} ₾ ფიქს.` : `${cfg.percentageReward}%`}</b>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setExpandedCfgId(expandedCfgId === cfg.id ? null : cfg.id)}
                          className="p-1.5 border border-slate-800 bg-slate-950 text-slate-400 rounded-lg cursor-pointer text-[9px] font-bold">
                          თანამშრ.
                        </button>
                        <button onClick={() => handleStartEditCfg(cfg)}
                          className="p-1.5 border border-slate-800 bg-slate-950 text-slate-400 rounded-lg cursor-pointer">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteCfg(cfg.id)}
                          className="p-1.5 border border-red-500/20 bg-red-950/20 text-red-400 rounded-lg cursor-pointer">
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {expandedCfgId === cfg.id && (
                      <div className="border-t border-slate-800 pt-3 space-y-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">თანამშრომლების ინდივიდუალური განაწილება:</p>
                        {mechanics.map(emp => {
                          const er = cfg.employeeRewards?.[emp.id];
                          const editKey = `${cfg.id}:${emp.id}`;
                          const isEditing = empEditId === editKey;
                          const isCoEditing = empCoMechEditKey === editKey;
                          const coMechUser = er?.coMechanicId ? mechanics.find(m => m.id === er.coMechanicId) : null;
                          return (
                            <div key={emp.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                              {/* Main reward row */}
                              {isEditing ? (
                                <div className="space-y-2">
                                  <span className="text-slate-300 font-bold">{emp.firstName} {emp.lastName}</span>
                                  <div className="grid grid-cols-2 gap-2">
                                    <select value={empRewardType} onChange={e => setEmpRewardType(e.target.value as any)}
                                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-[10px]">
                                      <option value="percentage">%</option>
                                      <option value="flat">₾ ფიქს.</option>
                                    </select>
                                    {empRewardType === 'percentage' ? (
                                      <input type="number" value={empPct} onChange={e => setEmpPct(Number(e.target.value))}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-center text-[10px]" />
                                    ) : (
                                      <input type="number" value={empFlat} onChange={e => setEmpFlat(Number(e.target.value))}
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono text-center text-[10px]" />
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => setEmpEditId(null)} className="flex-1 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[10px] cursor-pointer">გაუქმება</button>
                                    <button onClick={() => saveEmpReward(cfg.id, emp.id)} className="flex-1 py-1 bg-amber-500 text-slate-950 rounded text-[10px] font-bold cursor-pointer">შენახვა</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-300 font-semibold">{emp.firstName} {emp.lastName}</span>
                                    {er ? (
                                      <span className="ml-2 text-emerald-400 font-bold">{er.rewardType === 'flat' ? `${er.flatReward} ₾` : `${er.percentageReward}%`}</span>
                                    ) : (
                                      <span className="ml-2 text-slate-600 italic">default ({cfg.rewardType === 'flat' ? `${cfg.flatReward} ₾` : `${cfg.percentageReward}%`})</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => startEditEmpReward(cfg, emp.id)} className="p-1 border border-slate-700 bg-slate-900 text-slate-400 rounded cursor-pointer"><Edit className="w-3 h-3" /></button>
                                    {er && <button onClick={() => removeEmpReward(cfg.id, emp.id)} className="p-1 border border-red-500/20 bg-red-950/20 text-red-400 rounded cursor-pointer"><X className="w-3 h-3" /></button>}
                                  </div>
                                </div>
                              )}

                              {/* Per-employee permanent co-mechanic */}
                              {!isEditing && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-800/50">
                                  {isCoEditing ? (
                                    <div className="space-y-1.5">
                                      <select value={empCoMechUserId} onChange={e => setEmpCoMechUserId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 text-[10px]">
                                        <option value="">— არ არის —</option>
                                        {mechanics.filter(m => m.id !== emp.id).map(m => (
                                          <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                                        ))}
                                      </select>
                                      {empCoMechUserId && (
                                        <>
                                          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 border border-slate-800 rounded-lg">
                                            <button type="button" onClick={() => setEmpCoMechRewardType('flat')}
                                              className={`py-1 text-[9px] font-bold rounded cursor-pointer ${empCoMechRewardType === 'flat' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>₾ ფიქს.</button>
                                            <button type="button" onClick={() => setEmpCoMechRewardType('percentage')}
                                              className={`py-1 text-[9px] font-bold rounded cursor-pointer ${empCoMechRewardType === 'percentage' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>%</button>
                                          </div>
                                          <div className="flex items-center gap-1.5">
                                            <input type="number" value={empCoMechEarning} onChange={e => setEmpCoMechEarning(e.target.value)}
                                              placeholder="0" className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-[10px] text-center" />
                                            <span className="text-[10px] text-slate-400 font-bold">{empCoMechRewardType === 'flat' ? '₾' : '%'}</span>
                                          </div>
                                        </>
                                      )}
                                      <div className="flex gap-1.5">
                                        <button onClick={() => setEmpCoMechEditKey(null)} className="flex-1 py-1 bg-slate-900 border border-slate-800 text-slate-400 rounded text-[9px] cursor-pointer">გაუქმება</button>
                                        <button onClick={() => saveEmpCoMech(cfg.id, emp.id)} className="flex-1 py-1 bg-cyan-600 text-white rounded text-[9px] font-bold cursor-pointer flex items-center justify-center gap-1">
                                          <Check className="w-2.5 h-2.5" /> შენახვა
                                        </button>
                                      </div>
                                    </div>
                                  ) : coMechUser ? (
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] flex items-center gap-1">
                                        <UserPlus className="w-2.5 h-2.5 text-cyan-500" />
                                        <span className="text-slate-300">{coMechUser.firstName} {coMechUser.lastName}</span>
                                        <span className="text-cyan-400 font-bold ml-0.5">
                                          {er!.coMechanicRewardType === 'percentage' ? `${er!.coMechanicEarning}%` : `${er!.coMechanicEarning} ₾`}
                                        </span>
                                      </span>
                                      <div className="flex gap-1">
                                        <button onClick={() => { setEmpCoMechEditKey(editKey); setEmpCoMechUserId(er!.coMechanicId!); setEmpCoMechRewardType(er!.coMechanicRewardType || 'flat'); setEmpCoMechEarning(er!.coMechanicEarning ?? ''); }}
                                          className="p-0.5 border border-slate-700 bg-slate-900 text-slate-400 rounded cursor-pointer"><Edit className="w-2.5 h-2.5" /></button>
                                        <button onClick={() => removeEmpCoMech(cfg.id, emp.id)}
                                          className="p-0.5 border border-red-500/20 bg-red-950/20 text-red-400 rounded cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button onClick={() => { setEmpCoMechEditKey(editKey); setEmpCoMechUserId(''); setEmpCoMechRewardType('flat'); setEmpCoMechEarning(''); }}
                                      className="flex items-center gap-1 text-[10px] text-slate-600 hover:text-cyan-400 cursor-pointer transition-colors">
                                      <UserPlus className="w-2.5 h-2.5" /> მეორე შემსრულებელი
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Car Brands Tab */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300">მანქანის მარკები</h3>
          <form onSubmit={handleAddBrand} className="flex gap-2">
            <input
              type="text"
              value={newBrandName}
              onChange={e => setNewBrandName(e.target.value.toUpperCase())}
              placeholder="ახალი მარკა (მაგ: IVECO)"
              lang="en"
              autoCapitalize="characters"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono uppercase placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
            />
            <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            {carBrands.map(b => (
              <div key={b.id} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-slate-200">{b.name}</span>
                <button onClick={() => handleDeleteBrand(b.id)} className="p-1 text-red-400 hover:text-red-300 cursor-pointer">
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {carBrands.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs">მარკები არ მოიძებნა</div>
          )}
        </div>
      )}

      {/* Revenue share Tab (#3) */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            მომსახურების ფასიდან ხელოსნისა და სერვის მენეჯერის წილი (%). დანარჩენი რჩება მფლობელს.
            წილი დამოკიდებულია იმაზე, თუ ვინ მოიყვანა კლიენტი.
          </p>

          <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-cyan-400">ხელოსანმა მოიყვანა კლიენტი</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">ხელოსნის %</label>
                <input type="number" value={rsMechMech} onChange={e => setRsMechMech(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">სერვის მენეჯერის %</label>
                <input type="number" value={rsMechMgr} onChange={e => setRsMechMgr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">მფლობელი იღებს: {Math.max(0, 100 - (Number(rsMechMech) || 0) - (Number(rsMechMgr) || 0))}%</p>
          </div>

          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-amber-400">სერვისმა მოიყვანა კლიენტი</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">ხელოსნის %</label>
                <input type="number" value={rsSvcMech} onChange={e => setRsSvcMech(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">სერვის მენეჯერის %</label>
                <input type="number" value={rsSvcMgr} onChange={e => setRsSvcMgr(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50" />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">მფლობელი იღებს: {Math.max(0, 100 - (Number(rsSvcMech) || 0) - (Number(rsSvcMgr) || 0))}%</p>
          </div>

          <button onClick={saveRevenue}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Save className="w-4 h-4" /> პროცენტების შენახვა
          </button>
          <p className="text-[10px] text-slate-500 text-center">
            ცვლილება მოქმედებს ახალ ჩანაწერებზე. არსებული შეკვეთის გადასაანგარიშებლად შეცვალეთ „ვინ მოიყვანა" ფინანსებში.
          </p>
        </div>
      )}
    </div>
  );
}
