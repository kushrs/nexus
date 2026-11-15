import { useState, useEffect, useMemo } from 'react';
import { usersAPI } from '../services/api';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Copy,
  Check,
  Edit2,
  Trash2,
  Shield,
  User,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'USER' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data || []);
      setError('');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded (100 req/min). Please slow down.');
      } else {
        setError('Failed to fetch users from user-service.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDrawer = (userToEdit = null) => {
    if (userToEdit) {
      setEditUser(userToEdit);
      setForm({ name: userToEdit.name, email: userToEdit.email, role: userToEdit.role || 'USER' });
    } else {
      setEditUser(null);
      setForm({ name: '', email: '', role: 'USER' });
    }
    setShowDrawer(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (editUser) {
        await usersAPI.update(editUser.id, form);
      } else {
        await usersAPI.create(form);
      }
      setShowDrawer(false);
      setEditUser(null);
      setForm({ name: '', email: '', role: 'USER' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch {
      setError('Failed to delete user.');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center animate-spin">
          <UsersIcon className="w-6 h-6 text-primary-400" />
        </div>
        <p className="text-xs font-mono text-slate-400">QUERYING USER CLUSTER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary-400" />
            User Identity Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL UUID accounts persisted and load balanced across user-service-1 and user-service-2
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDrawer()}
            className="btn-primary text-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Directory Table Card */}
      <div className="control-card overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-white uppercase">
              RECORDS ({filteredUsers.length})
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field text-xs pl-8 py-1.5 w-64 font-mono"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-header text-left">USER ID (UUID)</th>
                <th className="table-header text-left">FULL NAME</th>
                <th className="table-header text-left">EMAIL ADDRESS</th>
                <th className="table-header text-left">ACCESS ROLE</th>
                <th className="table-header text-left">PROVISIONED AT</th>
                <th className="table-header text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredUsers.map((u) => {
                const isCopied = copiedId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{u.id?.substring(0, 8)}...</span>
                        <button
                          onClick={() => copyToClipboard(u.id, u.id)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy UUID"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-white">{u.name}</td>
                    <td className="py-3 px-4 text-slate-300">{u.email}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          u.role === 'ADMIN' ? 'badge-purple' : 'badge-info'
                        }`}
                      >
                        {u.role === 'ADMIN' ? (
                          <Shield className="w-3 h-3" />
                        ) : (
                          <User className="w-3 h-3" />
                        )}
                        {u.role || 'USER'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDrawer(u)}
                          className="btn-ghost p-1.5"
                          title="Edit user"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400 hover:text-primary-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="btn-ghost p-1.5 hover:text-rose-400"
                          title="Delete user"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over User Form Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-surface-900 border-l border-white/[0.1] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">
                    {editUser ? 'EDIT USER RECORD' : 'PROVISION NEW USER'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field text-xs"
                    placeholder="e.g. Alice Chen"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field text-xs font-mono"
                    placeholder="alice@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    ROLE PERMISSION
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="input-field text-xs font-mono"
                  >
                    <option value="USER">USER (Standard Access)</option>
                    <option value="ADMIN">ADMIN (Full Gateway Access)</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full text-xs py-2.5"
                  >
                    {submitting
                      ? 'Saving to DB...'
                      : editUser
                      ? 'Update Record'
                      : 'Provision User Record'}
                  </button>
                </div>
              </form>
            </div>

            <button
              onClick={() => setShowDrawer(false)}
              className="btn-secondary text-xs w-full mt-4"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
