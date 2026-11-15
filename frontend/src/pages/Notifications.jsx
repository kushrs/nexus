import { useState, useEffect } from 'react';
import { notificationsAPI, usersAPI } from '../services/api';
import {
  Bell,
  Send,
  Search,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  X,
} from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState({ message: '', type: 'INFO', userId: '' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [notifRes, userRes] = await Promise.all([
        notificationsAPI.getAll(),
        usersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setNotifications(notifRes.data || []);
      setUsers(userRes.data || []);
      if (userRes.data?.length > 0 && !form.userId) {
        setForm((prev) => ({ ...prev, userId: userRes.data[0].id }));
      }
      setError('');
    } catch (err) {
      if (err.response?.status === 429) setError('Rate limit exceeded (100 req/min).');
      else setError('Failed to load notifications from notification-service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await notificationsAPI.create({
        message: form.message,
        type: form.type,
        userId: form.userId,
      });
      setShowDrawer(false);
      setForm({ message: '', type: 'INFO', userId: users[0]?.id || '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch notification');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const filteredNotifications = notifications.filter(
    (n) =>
      n.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'ERROR':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center animate-spin">
          <Bell className="w-6 h-6 text-primary-400" />
        </div>
        <p className="text-xs font-mono text-slate-400">CONNECTING TO DISPATCH CLUSTER...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-400" />
            Alerts &amp; Dispatch Queue
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Event dispatches and system communications load balanced across notification-service-1 and notification-service-2
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="btn-primary text-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch Notification</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="control-card overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-950/40">
          <span className="text-xs font-mono font-semibold text-white uppercase">
            DISPATCH LOGS ({filteredNotifications.length})
          </span>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search message, type, UUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field text-xs pl-8 py-1.5 w-64 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-header text-left">NOTIFICATION ID</th>
                <th className="table-header text-left">SEVERITY / TYPE</th>
                <th className="table-header text-left">DISPATCH PAYLOAD</th>
                <th className="table-header text-left">TARGET USER (UUID)</th>
                <th className="table-header text-left">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredNotifications.map((n) => {
                const isCopied = copiedId === n.id;
                return (
                  <tr key={n.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{n.id?.substring(0, 8)}...</span>
                        <button
                          onClick={() => copyToClipboard(n.id, n.id)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy UUID"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          n.type === 'SUCCESS'
                            ? 'badge-success'
                            : n.type === 'WARNING'
                            ? 'badge-warning'
                            : n.type === 'ERROR'
                            ? 'badge-error'
                            : 'badge-info'
                        }`}
                      >
                        {getTypeIcon(n.type)}
                        {n.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-200 font-medium">
                      {n.message}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {n.userId ? `${n.userId.substring(0, 8)}...` : 'GLOBAL'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}

              {filteredNotifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    No dispatches logged yet. Click "Dispatch Notification" to send one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Dispatch Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-surface-900 border-l border-white/[0.1] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">DISPATCH NEW ALERT</h3>
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
                    ALERT TYPE
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input-field text-xs font-mono"
                  >
                    <option value="INFO">INFO (Informational)</option>
                    <option value="SUCCESS">SUCCESS (Confirmation)</option>
                    <option value="WARNING">WARNING (High Latency / Rate)</option>
                    <option value="ERROR">ERROR (Service Failure)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    RECIPIENT USER
                  </label>
                  {users.length > 0 ? (
                    <select
                      value={form.userId}
                      onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      className="input-field text-xs font-mono"
                      required
                    >
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter Target User UUID..."
                      value={form.userId}
                      onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      className="input-field text-xs font-mono"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    MESSAGE PAYLOAD
                  </label>
                  <textarea
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="input-field text-xs font-sans"
                    placeholder="Enter alert message details..."
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full text-xs py-2.5"
                  >
                    {submitting ? 'Dispatching to Notification Service...' : 'Broadcast Alert'}
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
