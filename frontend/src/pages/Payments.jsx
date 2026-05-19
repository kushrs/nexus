import { useState, useEffect } from 'react';
import { paymentsAPI } from '../services/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', status: 'PENDING', userId: '' });
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    try {
      const res = await paymentsAPI.getAll();
      setPayments(res.data);
    } catch (err) {
      if (err.response?.status === 429) setError('Rate limit exceeded.');
      else setError('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await paymentsAPI.create({ ...form, amount: parseFloat(form.amount), userId: parseInt(form.userId) });
      setShowForm(false);
      setForm({ amount: '', status: 'PENDING', userId: '' });
      fetchPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>;
  }

  const statusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'badge-success';
      case 'PENDING': return 'badge-warning';
      case 'FAILED': return 'badge-error';
      default: return 'badge-info';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">Transaction history and management</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ New Payment'}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Create Payment</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
              <input className="input-field" type="number" step="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs text-gray-500 mb-1">User ID</label>
              <input className="input-field" type="number" value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary text-sm">Create</button>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="table-header text-left py-3 px-6">ID</th>
              <th className="table-header text-left py-3 px-6">Amount</th>
              <th className="table-header text-left py-3 px-6">Status</th>
              <th className="table-header text-left py-3 px-6">User ID</th>
              <th className="table-header text-left py-3 px-6">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-6 text-gray-400">#{p.id}</td>
                <td className="py-3 px-6 text-white font-semibold">${parseFloat(p.amount).toFixed(2)}</td>
                <td className="py-3 px-6"><span className={`badge ${statusColor(p.status)}`}>{p.status}</span></td>
                <td className="py-3 px-6 text-gray-400">{p.userId}</td>
                <td className="py-3 px-6 text-gray-500 text-xs">{p.createdAt?.split('T')[0]}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-gray-600">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
