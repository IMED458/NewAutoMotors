import { useState } from 'react';
import { Box, User, isOwnerLike } from '../types';
import { Boxes, Plus, Trash2, Edit, Save, X, Wrench, ShieldCheck, UserPlus, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface BoxesViewProps {
  boxes: Box[];
  users: User[];
  currentUser: User;
  onSaveBoxes: (boxes: Box[]) => void;
}

export default function BoxesView({ boxes, users, currentUser, onSaveBoxes }: BoxesViewProps) {
  // Owner, general manager and the analyst can fully manage boxes
  const canManage = isOwnerLike(currentUser.role) || currentUser.role === 'developer';
  const isServiceManager = currentUser.role === 'service_manager';

  const serviceManagers = users.filter(u => u.role === 'service_manager');
  const mechanics = users.filter(u => u.role === 'mechanic');

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editMechs, setEditMechs] = useState<string[]>([]);
  const [mechanicToAdd, setMechanicToAdd] = useState('');
  const [boxFilter, setBoxFilter] = useState<'all' | 'mine'>('all');

  const userName = (id?: string) => {
    if (!id) return '—';
    const u = users.find(x => x.id === id);
    return u ? `${u.firstName} ${u.lastName}`.trim() : '—';
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    const box: Box = {
      id: `box-${Date.now()}`,
      name: newName.trim(),
      mechanicIds: [],
      createdAt: new Date().toISOString(),
    };
    onSaveBoxes([...boxes, box]);
    setNewName('');
    setShowAdd(false);
  };

  const openEdit = (b: Box) => {
    setEditingId(b.id);
    setEditName(b.name);
    setEditManager(b.serviceManagerId || '');
    setEditMechs(b.mechanicIds || []);
    setMechanicToAdd('');
  };

  const saveEdit = () => {
    onSaveBoxes(boxes.map(b => b.id === editingId
      ? { ...b, name: editName.trim() || b.name, serviceManagerId: editManager || undefined, mechanicIds: editMechs }
      : b));
    setEditingId(null);
  };

  const deleteBox = (id: string) => {
    if (confirm('ნამდვილად წაიშალოს ეს ბოქსი?')) onSaveBoxes(boxes.filter(b => b.id !== id));
  };

  const addMechanic = () => {
    if (!mechanicToAdd) return;
    setEditMechs(prev => prev.includes(mechanicToAdd) ? prev : [...prev, mechanicToAdd]);
    setMechanicToAdd('');
  };

  // Service managers can inspect every box; their own boxes stay first when all are shown.
  const sortedBoxes = isServiceManager
    ? [...boxes].sort((a, b) => Number(b.serviceManagerId === currentUser.id) - Number(a.serviceManagerId === currentUser.id))
    : boxes;
  const visibleBoxes = isServiceManager && boxFilter === 'mine'
    ? sortedBoxes.filter(box => box.serviceManagerId === currentUser.id)
    : sortedBoxes;

  return (
    <div className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <span className="bg-amber-500/10 p-2 rounded-xl text-amber-500 border border-amber-500/20">
            <Boxes className="w-5 h-5" />
          </span>
          ბოქსები ({boxes.length})
        </h2>
        {canManage && (
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors">
            <Plus className="w-3.5 h-3.5" /> {showAdd ? 'დახურვა' : 'ბოქსის დამატება'}
          </button>
        )}
      </div>

      {isServiceManager && (
        <div className="mb-4 bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-slate-400">ყველა სერვის მენეჯერი ხედავს ყველა ბოქსს. „ჩემი ბოქსები“ მხოლოდ თქვენს პასუხისმგებლობაში არსებულებს აჩვენებს.</p>
          <label className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap"><Filter className="w-3.5 h-3.5 text-amber-400" />
            <select value={boxFilter} onChange={e => setBoxFilter(e.target.value as 'all' | 'mine')} className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200">
              <option value="all">ყველა ბოქსი</option><option value="mine">ჩემი ბოქსები</option>
            </select>
          </label>
        </div>
      )}

      {showAdd && canManage && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 space-y-3 overflow-hidden">
          <label className="block text-[11px] text-slate-400 font-semibold">ბოქსის სახელი</label>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="მაგ: ბოქსი 1"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
          <button onClick={handleAdd}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl cursor-pointer">დამატება</button>
        </motion.div>
      )}

      <div className="space-y-3">
        {visibleBoxes.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 text-xs">
            ბოქსები ჯერ არ არის დამატებული.
          </div>
        )}
        {visibleBoxes.map(b => {
          const isMine = isServiceManager && b.serviceManagerId === currentUser.id;
          const isEditing = editingId === b.id;
          return (
            <div key={b.id} className={`bg-slate-900 border rounded-2xl p-4 shadow-md ${isMine ? 'border-amber-500/40' : 'border-slate-800'}`}>
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">სახელი</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-sm text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">სერვის მენეჯერი</label>
                    <select value={editManager} onChange={e => setEditManager(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-sm text-slate-200">
                      <option value="">— არ არის მინიჭებული —</option>
                      {serviceManagers.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">ხელოსნები ({editMechs.length})</label>
                    <div className="flex gap-2">
                      <select value={mechanicToAdd} onChange={e => setMechanicToAdd(e.target.value)} className="min-w-0 flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200">
                        <option value="">— აირჩიეთ ხელოსანი —</option>
                        {mechanics.filter(m => !editMechs.includes(m.id)).map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                      </select>
                      <button type="button" onClick={addMechanic} disabled={!mechanicToAdd} className="px-3 py-2 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs disabled:opacity-40"><UserPlus className="w-4 h-4" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {editMechs.map(id => <span key={id} className="inline-flex items-center gap-1 bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 px-2 py-1 rounded-lg text-xs font-semibold">{userName(id)}<button type="button" onClick={() => setEditMechs(prev => prev.filter(item => item !== id))} aria-label={`${userName(id)} წაშლა`} className="text-cyan-200 hover:text-white"><X className="w-3 h-3" /></button></span>)}
                      {editMechs.length === 0 && <span className="text-[11px] text-slate-600">არცერთი ხელოსანი არ არის დამატებული.</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setEditingId(null)}
                      className="py-2 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold rounded-lg cursor-pointer flex items-center justify-center gap-1"><X className="w-3.5 h-3.5" /> გაუქმება</button>
                    <button onClick={saveEdit}
                      className="py-2 bg-amber-500 text-slate-950 text-xs font-black rounded-lg cursor-pointer flex items-center justify-center gap-1"><Save className="w-3.5 h-3.5" /> შენახვა</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h3 className="font-black text-slate-100 flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-amber-400" /> {b.name}
                      {isMine && <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full">ჩემი</span>}
                    </h3>
                    {canManage && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(b)} className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 rounded-xl cursor-pointer"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteBox(b.id)} className="p-2 bg-red-950/25 hover:bg-red-950/45 border border-red-500/25 text-red-400 rounded-xl cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    მენეჯერი: <b className="text-slate-200">{userName(b.serviceManagerId)}</b>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1"><Wrench className="w-3 h-3" /> ხელოსნები:</span>
                    {(b.mechanicIds || []).length === 0
                      ? <span className="text-[11px] text-slate-600">არ არის</span>
                      : b.mechanicIds.map(id => (
                        <span key={id} className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-semibold">{userName(id)}</span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
