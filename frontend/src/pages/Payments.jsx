import { useState, useEffect } from 'react';
import { paymentsAPI, usersAPI } from '../services/api';
import {
  CreditCard,
  PlusCircle,
  Search,
  Copy,
  Check,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowUpRight,
} from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState({ amount: '', status: 'COMPLETED', userId: '' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [payRes, userRes] = await Promise.all([
        paymentsAPI.getAll(),
        usersAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setPayments(payRes.data || []);
      setUsers(userRes.data || []);
      if (userRes.data?.length > 0 && !form.userId) {
        setForm((prev) => ({ ...prev, userId: userRes.data[0].id }));
      }
      setError('');
    } catch (err) {
      if (err.response?.status === 429) setError('Rate limit exceeded (100 req/min).');
      else setError('Failed to load transaction records from payment-service.');
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
      await paymentsAPI.create({
        amount: parseFloat(form.amount),
        status: form.status,
        userId: form.userId,
      });
      setShowDrawer(false);
      setForm({ amount: '', status: 'COMPLETED', userId: users[0]?.id || '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.userId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVolume = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center animate-spin">
          <CreditCard className="w-6 h-6 text-primary-400" />
        </div>
        <p className="text-xs font-mono text-slate-400">CONNECTING TO PAYMENT SERVICE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary-400" />
            Payment Ledger & Transactions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Distributed microservice transactions routed across payment-service-1 and payment-service-2
          </p>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="btn-primary text-xs"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Transaction</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Volume KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <span className="text-xs font-mono text-slate-400 uppercase">SETTLED VOLUME</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            ${totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-400 font-mono mt-1 block">Live aggregated</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-mono text-slate-400 uppercase">TRANSACTION COUNT</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">{payments.length}</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Total records</span>
        </div>
        <div className="stat-card">
          <span className="text-xs font-mono text-slate-400 uppercase">SERVICE REPLICAS</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">2 Active</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">:8083 &amp; :8093</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="control-card overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-950/40">
          <span className="text-xs font-mono font-semibold text-white uppercase">
            TRANSACTION LOGS ({filteredPayments.length})
          </span>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, UUID, status..."
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
                <th className="table-header text-left">TRANSACTION ID</th>
                <th className="table-header text-left">AMOUNT (USD)</th>
                <th className="table-header text-left">STATUS</th>
                <th className="table-header text-left">USER ID (UUID)</th>
                <th className="table-header text-left">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredPayments.map((p) => {
                const isCopied = copiedId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300">{p.id?.substring(0, 8)}...</span>
                        <button
                          onClick={() => copyToClipboard(p.id, p.id)}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy UUID"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-white font-bold text-sm">
                      ${parseFloat(p.amount).toFixed(2)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          p.status === 'COMPLETED'
                            ? 'badge-success'
                            : p.status === 'PENDING'
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {p.userId ? `${p.userId.substring(0, 8)}...` : 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-sans">
                    No transactions recorded yet. Click "+ New Transaction" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Payment Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-surface-900 border-l border-white/[0.1] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">RECORD NEW TRANSACTION</h3>
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
                    AMOUNT (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="input-field text-xs pl-8 font-mono"
                      placeholder="99.99"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    STATUS STATE
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input-field text-xs font-mono"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    ASSOCIATED USER
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
                      placeholder="Enter User UUID..."
                      value={form.userId}
                      onChange={(e) => setForm({ ...form, userId: e.target.value })}
                      className="input-field text-xs font-mono"
                      required
                    />
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full text-xs py-2.5"
                  >
                    {submitting ? 'Dispatching to Payment Service...' : 'Commit Transaction'}
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
