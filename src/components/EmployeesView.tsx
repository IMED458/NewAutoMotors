import React, { useState } from 'react';
import { User, Role, ROLE_LABELS, isOwnerLike } from '../types';
import { hashPassword } from '../utils/crypto';
import { UserPlus, Trash2, Shield, Wrench, AlertCircle, Edit, Save, X, Crown } from 'lucide-react';
import { motion } from 'motion/react';

/** Sensible default module access for a freshly-created user of a given role. */
function defaultModulesForRole(role: Role): string[] {
  if (role === 'super_admin' || role === 'general_manager') return ['shop', 'day_closing', 'reports'];
  if (role === 'shop') return ['shop'];
  if (role === 'cashier') return ['shop', 'day_closing'];
  if (role === 'accountant') return ['reports'];
  return [];
}

interface EmployeesViewProps {
  users: User[];
  currentUser: User;
  onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export default function EmployeesView({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }: EmployeesViewProps) {
  // Owner & general manager have full personnel-management permissions.
  // The analyst (developer) can also manage users — needed to bootstrap the first owner.
  const isOwner = isOwnerLike(currentUser.role) || currentUser.role === 'developer';

  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('mechanic');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit modal state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('mechanic');
  const [editModules, setEditModules] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !username.trim() || !password.trim()) {
      setError('გთხოვთ შეავსოთ სახელი, იუზერნეიმი და პაროლი');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('ეს იუზერნეიმი უკვე დაკავებულია');
      return;
    }
    onAddUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
      passwordHash: hashPassword(password),
      role,
      enabledModules: defaultModulesForRole(role),
    });
    setSuccess('თანამშრომელი დაემატა!');
    setFirstName(''); setLastName(''); setUsername(''); setPassword('');
    setRole('mechanic'); setShowAddForm(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditFirst(u.firstName);
    setEditLast(u.lastName);
    setEditUsername(u.username);
    setEditPassword('');
    setEditRole(u.role);
    setEditModules(u.enabledModules ?? []);
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    // Check username uniqueness (ignore self)
    if (editUsername.trim() && users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === editUsername.trim().toLowerCase())) {
      setSuccess('');
      setError('ეს იუზერნეიმი უკვე დაკავებულია');
      return;
    }
    const updates: Partial<User> = {
      firstName: editFirst.trim(),
      lastName: editLast.trim(),
      role: editRole,
      enabledModules: editModules,
    };
    if (editUsername.trim()) {
      (updates as any).username = editUsername.trim().toLowerCase();
    }
    if (editPassword.trim()) {
      (updates as any).passwordHash = hashPassword(editPassword.trim());
    }
    onUpdateUser(editingUser.id, updates);
    setEditingUser(null);
    setError('');
    setSuccess('ცვლილებები შენახულია!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const toggleModule = (mod: string) => {
    setEditModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const allModules = [
    { id: 'shop', label: 'მაღაზია' },
    { id: 'day_closing', label: 'დღის დახურვა' },
    { id: 'reports', label: 'ფინანსური ანგარიში' },
  ];

  const getRoleIcon = (r: Role) => {
    if (r === 'super_admin' || r === 'general_manager') return <Crown className="w-4 h-4" />;
    if (r === 'service_manager') return <Shield className="w-4 h-4" />;
    return <Wrench className="w-4 h-4" />;
  };

  const getRoleStyle = (r: Role) => {
    if (r === 'super_admin') return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
    if (r === 'general_manager') return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
    if (r === 'service_manager') return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    if (r === 'shop') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (r === 'cashier') return 'bg-teal-500/10 border-teal-500/20 text-teal-400';
    if (r === 'accountant') return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    return 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400';
  };

  // All assignable roles (the protected analyst/developer role is never assignable here)
  const allRoleOptions: { value: Role; label: string }[] = [
    { value: 'super_admin', label: 'მფლობელი' },
    { value: 'general_manager', label: 'გენერალური მენეჯერი' },
    { value: 'service_manager', label: 'სერვის მენეჯერი' },
    { value: 'mechanic', label: 'ხელოსანი' },
    { value: 'shop', label: 'მაღაზია' },
    { value: 'cashier', label: 'მოლარე' },
    { value: 'accountant', label: 'ბუღალტერი' },
  ];

  const availableRoles = allRoleOptions;

  const canEdit = (u: User) => {
    if (u.id === currentUser.id) return true;
    return isOwner;
  };

  const canDelete = (u: User) => {
    if (u.id === currentUser.id) return false;
    // Protect the analyst/system account from deletion
    if (u.username === 'imedo') return false;
    return isOwner;
  };

  // Can we change this user's role in the edit modal?
  const canEditRole = (u: User) => {
    if (u.id === currentUser.id) return false;  // can't change own role
    if (u.username === 'imedo') return false;    // protect analyst account role
    return isOwner;
  };

  return (
    <div className="max-w-lg mx-auto p-4 pb-28 bg-slate-950 text-slate-100 font-sans md:max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-300">პერსონალი ({users.length})</h3>
        {isOwner && (
          <button
            onClick={() => { setShowAddForm(!showAddForm); setError(''); }}
            className="flex items-center gap-1.5 text-xs text-slate-950 bg-amber-500 hover:bg-amber-600 font-bold px-3 py-2 rounded-xl cursor-pointer transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            {showAddForm ? 'დახურვა' : 'დამატება'}
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-green-950/40 border border-green-500/20 text-green-400 text-xs rounded-xl mb-3">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl mb-3 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4 shadow-xl space-y-4 overflow-hidden"
        >
          <h3 className="text-sm font-bold text-amber-500">ახალი თანამშრომლის დამატება</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">სახელი *</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="სახელი"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50" />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">გვარი</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="გვარი"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">იუზერნეიმი *</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="username (ლათინური)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50 font-mono" />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">პაროლი *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50" />
            </div>

            {/* Role — dropdown select for full control */}
            <div>
              <label className="block text-[11px] text-slate-400 font-semibold mb-1">როლი *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 font-medium"
              >
                {availableRoles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full py-3 mt-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl cursor-pointer active:scale-[0.98] transition-all">
              შენახვა და დამატება
            </button>
          </form>
        </motion.div>
      )}

      <div className="space-y-2.5">
        {users.map(user => {
          const isOwn = user.id === currentUser.id;
          const isDev = user.username === 'imedo';
          return (
            <div key={user.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl border flex-shrink-0 ${getRoleStyle(user.role)}`}>
                  {getRoleIcon(user.role)}
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-200 truncate">
                    {user.firstName} {user.lastName}
                    {isOwn && <span className="text-[10px] text-slate-500 ml-1">(თქვენ)</span>}
                    {isDev && <span className="text-[10px] text-indigo-400/70 ml-1">(sys)</span>}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    <span className="font-mono">@{user.username}</span>
                    <span>·</span>
                    <span className="truncate">{ROLE_LABELS[user.role]}</span>
                    {(user.enabledModules ?? []).length > 0 && (
                      <span className="text-[9px] text-amber-500/60">· {(user.enabledModules ?? []).length} მოდული</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {canEdit(user) && (
                  <button onClick={() => openEdit(user)}
                    className="p-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-amber-400 rounded-xl cursor-pointer transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete(user) && (
                  <button onClick={() => { if (confirm(`წაიშალოს ${user.firstName}?`)) onDeleteUser(user.id); }}
                    className="p-2 bg-red-950/25 hover:bg-red-950/45 border border-red-500/25 text-red-400 rounded-xl cursor-pointer transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-100">რედაქტირება</h3>
              <button onClick={() => { setEditingUser(null); setError(''); }} className="text-slate-500 hover:text-slate-200 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">სახელი</label>
                  <input type="text" value={editFirst} onChange={e => setEditFirst(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">გვარი</label>
                  <input type="text" value={editLast} onChange={e => setEditLast(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">იუზერნეიმი</label>
                <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)}
                  placeholder="username (ლათინური)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono" />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">ახალი პაროლი (სურვილისამებრ)</label>
                <input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)}
                  placeholder="ცარიელი = არ შეიცვლება"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50" />
              </div>

              {canEditRole(editingUser) && (
                <>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">როლი</label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value as Role)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500/50 font-medium"
                    >
                      {allRoleOptions.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-2">ჩართული მოდულები</label>
                    <div className="space-y-2.5">
                      {allModules.map(mod => (
                        <div key={mod.id} className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${editModules.includes(mod.id) ? 'text-amber-400' : 'text-slate-400'}`}>
                            {mod.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleModule(mod.id)}
                            className={`w-11 h-6 rounded-full transition-all relative cursor-pointer flex-shrink-0 ${editModules.includes(mod.id) ? 'bg-amber-500' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editModules.includes(mod.id) ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button type="button" onClick={() => { setEditingUser(null); setError(''); }}
                  className="py-2.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl text-xs font-semibold cursor-pointer">
                  გაუქმება
                </button>
                <button type="button" onClick={handleSaveEdit}
                  className="py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] transition-all">
                  <Save className="w-3.5 h-3.5" /> შენახვა
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
