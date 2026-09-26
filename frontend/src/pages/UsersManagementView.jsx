import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ConfirmModal } from '../components/ConfirmModal';

// What each role actually does today (matches what the backend enforces).
const ROLE_META = {
  ADMIN: {
    label: 'Admin',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    desc: 'Full access, including Clear All and role/permission-level actions.'
  },
  MANAGER: {
    label: 'Manager',
    badge: 'bg-violet-100 text-violet-800 border-violet-300',
    desc: 'Sees every counselor\'s leads.'
  },
  SR_COUNSELLOR: {
    label: 'Sr. Counsellor',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Sees all leads; can restore archived leads, assign campaigns and create tasks.'
  },
  LEAD_FINDER: {
    label: 'Counselor',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: 'Sees and works only the leads assigned to them.'
  },
  VIEWER: {
    label: 'Viewer',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    desc: 'Intended as read-only access (not separately enforced yet).'
  }
};

const ROLE_ORDER = ['ADMIN', 'MANAGER', 'SR_COUNSELLOR', 'LEAD_FINDER', 'VIEWER'];

const emptyForm = { name: '', username: '', email: '', phone: '', role: 'LEAD_FINDER', password: '', isActive: true };

export const UsersManagementView = ({ currentUser, darkMode }) => {
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmConfig, setConfirmConfig] = useState(null);

  // Create / edit / deactivate / reset-password have no backend endpoints yet
  // (only GET /users exists), so those actions are UI-only for now - this
  // banner makes that explicit instead of implying something was saved.
  const [previewNotice, setPreviewNotice] = useState(null);

  useEffect(() => {
    if (isAdmin) loadUsers();
    else setLoading(false);
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setLoadError(err.message || 'Failed to load users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const card = darkMode ? 'bg-[#2A220C] border-[#574719]' : 'bg-white border-slate-200';
  const inputCls = `w-full border rounded-lg p-2 outline-none ${
    darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
  }`;
  const labelCls = `block font-semibold mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`;

  if (!isAdmin) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[50vh] rounded-xl border p-8 text-center ${card}`}>
        <span className="material-symbols-outlined text-[40px] text-slate-400 mb-2">lock</span>
        <h2 className={`font-extrabold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Admin Access Only</h2>
        <p className={`text-sm max-w-md mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          User management is restricted to administrators.
        </p>
      </div>
    );
  }

  const countByRole = (roles) => users.filter(u => roles.includes(u.role)).length;
  const stats = [
    { label: 'Total Users', value: users.length, icon: 'group', tint: 'text-slate-500' },
    { label: 'Admins', value: countByRole(['ADMIN']), icon: 'shield_person', tint: 'text-rose-500' },
    { label: 'Sr. Counsellors / Managers', value: countByRole(['SR_COUNSELLOR', 'MANAGER']), icon: 'supervisor_account', tint: 'text-amber-500' },
    { label: 'Counselors', value: countByRole(['LEAD_FINDER']), icon: 'support_agent', tint: 'text-sky-500' }
  ];

  const filtered = users.filter(u => {
    if (roleFilter !== 'All Roles' && u.role !== roleFilter) return false;
    if (search) {
      const t = search.toLowerCase();
      return [u.name, u.username, u.email, u.phone].some(v => (v || '').toLowerCase().includes(t));
    }
    return true;
  });

  const openAdd = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'LEAD_FINDER',
      password: '',
      isActive: u.isActive !== false
    });
    setFormError(null);
    setShowModal(true);
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.email.trim()) {
      setFormError('Name, username and email are required.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!editingUser && form.password.length < 8) {
      setFormError('Temporary password must be at least 8 characters.');
      return;
    }
    setShowModal(false);
    setPreviewNotice(editingUser
      ? `Edit for "${editingUser.name}" isn't connected to the backend yet - nothing was saved.`
      : `Creating "${form.name.trim()}" isn't connected to the backend yet - nothing was saved.`);
  };

  const promptDeactivate = (u) => {
    setConfirmConfig({
      title: 'Deactivate User?',
      message: `"${u.name}" will no longer be able to log in, and stops receiving auto-assigned leads. (UI preview - not connected to the backend yet.)`,
      confirmText: 'Yes, Deactivate',
      type: 'danger',
      onConfirm: () => {
        setPreviewNotice(`Deactivating "${u.name}" isn't connected to the backend yet - nothing was changed.`);
        setConfirmConfig(null);
      }
    });
  };

  const submitReset = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return;
    setPreviewNotice(`Password reset for "${resetTarget.name}" isn't connected to the backend yet - nothing was changed.`);
    setResetTarget(null);
    setNewPassword('');
  };

  const initials = (name) => (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

  return (
    <div className={`space-y-4 font-sans transition-colors ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>

      {/* Title bar */}
      <div className={`flex justify-between items-center p-3.5 rounded-xl border shadow-xs ${card}`}>
        <h2 className={`font-bold text-base flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-slate-400 text-xl">manage_accounts</span>
          <span>User Management</span>
        </h2>
        <button
          onClick={openAdd}
          className="bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">person_add</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Persistent UI-preview banner */}
      <div className={`flex items-start gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${
        darkMode ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <span className="material-symbols-outlined text-[16px] mt-px">info</span>
        <span>UI preview: the user list is live, but adding, editing, deactivating and password reset are not connected to the backend yet.</span>
      </div>

      {previewNotice && (
        <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
          darkMode ? 'bg-sky-950/30 border-sky-800/40 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-800'
        }`}>
          <span>{previewNotice}</span>
          <button onClick={() => setPreviewNotice(null)} className="opacity-70 hover:opacity-100">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {loadError && (
        <div className="flex items-center justify-between gap-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-xs font-semibold">
          <span>{loadError}</span>
          <button onClick={loadUsers} className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold">Retry</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 shadow-xs ${card}`}>
            <span className={`material-symbols-outlined text-[28px] ${s.tint}`}>{s.icon}</span>
            <div>
              <p className={`text-xl font-extrabold leading-none ${darkMode ? 'text-white' : 'text-slate-900'}`}>{loading ? '-' : s.value}</p>
              <p className={`text-[11px] mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + table */}
      <div className={`rounded-xl border shadow-xs overflow-hidden ${card}`}>
        <div className={`p-3.5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between border-b text-xs ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`border rounded-lg p-2 font-medium outline-none ${darkMode ? 'bg-[#1A1608] border-[#574719] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
            >
              <option>All Roles</option>
              {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
            </select>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, username, email, phone..."
            className={`border rounded-lg px-3 py-2 outline-none w-full sm:w-72 ${darkMode ? 'bg-[#1A1608] border-[#574719] text-white placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900'}`}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`font-bold uppercase text-[11px] tracking-wider ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-[#0F172A] text-white'}`}>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4 text-center">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-[#222936]' : 'divide-slate-100'}`}>
              {loading ? (
                <tr><td colSpan="7" className="py-12 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl animate-spin">sync</span>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="py-12 text-center text-slate-400 font-medium">No users found</td></tr>
              ) : filtered.map(u => {
                const meta = ROLE_META[u.role] || { label: u.role, badge: 'bg-slate-100 text-slate-700 border-slate-300' };
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className={`transition-colors ${darkMode ? 'hover:bg-[#3D3212]' : 'hover:bg-slate-50/80'}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-[#7D610F] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {initials(u.name)}
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {u.name}{isSelf && <span className="ml-1.5 text-[10px] font-semibold text-slate-400">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{u.username}</td>
                    <td className={`py-3 px-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{u.email || '-'}</td>
                    <td className={`py-3 px-4 font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{u.phone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>{meta.label}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.isActive !== false ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(u)} title="Edit user"
                          className="w-7 h-7 rounded bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => { setResetTarget(u); setNewPassword(''); }} title="Reset password"
                          className="w-7 h-7 rounded bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center hover:bg-sky-100 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">key</span>
                        </button>
                        <button onClick={() => promptDeactivate(u)} disabled={isSelf}
                          title={isSelf ? "You can't deactivate your own account" : 'Deactivate user'}
                          className="w-7 h-7 rounded bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <span className="material-symbols-outlined text-[16px]">person_off</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role guide */}
      <div className={`rounded-xl border p-4 shadow-xs ${card}`}>
        <h3 className={`font-bold text-xs uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Role guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
          {ROLE_ORDER.map(r => (
            <div key={r} className="flex items-start gap-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${ROLE_META[r].badge}`}>{ROLE_META[r].label}</span>
              <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>{ROLE_META[r].desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-lg p-6 space-y-4 ${darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex justify-between items-center border-b pb-3 ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
              <h3 className="font-bold text-base">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="e.g. MS. RIYA" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Username *</label>
                  <input type="text" value={form.username} onChange={(e) => setField('username', e.target.value)} placeholder="e.g. riya" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="riya@aeero.edu" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 ..." className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Role</label>
                <select value={form.role} onChange={(e) => setField('role', e.target.value)} className={inputCls}>
                  {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
                </select>
                <p className={`mt-1 text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ROLE_META[form.role].desc}</p>
              </div>

              {!editingUser && (
                <div>
                  <label className={labelCls}>Temporary Password * <span className="font-normal opacity-60">(min 8 characters)</span></label>
                  <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} className={inputCls} />
                </div>
              )}

              {editingUser && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setField('isActive', e.target.checked)} className="w-3.5 h-3.5 rounded accent-emerald-600" />
                  <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>Account is active (can log in)</span>
                </label>
              )}

              {formError && <p className="text-rose-600 font-medium">{formError}</p>}

              <div className={`pt-3 flex justify-end gap-2 border-t ${darkMode ? 'border-[#574719]' : 'border-slate-100'}`}>
                <button type="button" onClick={() => setShowModal(false)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-[#1A1608] hover:bg-[#3D3212] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg font-bold shadow-sm">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className={`rounded-xl shadow-2xl border w-full max-w-sm p-6 space-y-4 ${darkMode ? 'bg-[#2A220C] border-[#574719] text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base">Reset Password</h3>
              <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-200">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Set a new password for <strong>{resetTarget.name}</strong>.</p>
            <form onSubmit={submitReset} className="space-y-3 text-xs">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 characters)" className={inputCls} />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setResetTarget(null)}
                  className={`px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-[#1A1608] text-slate-300' : 'bg-slate-100 text-slate-700'}`}>Cancel</button>
                <button type="submit" disabled={newPassword.length < 8}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold disabled:opacity-50">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmConfig}
        onClose={() => setConfirmConfig(null)}
        darkMode={darkMode}
        {...confirmConfig}
      />
    </div>
  );
};
