import { useState, useEffect } from 'react';
import { notificationsAPI } from '../services/api';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ message: '', type: 'INFO', userId: '' });
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
    } catch (err) {
      if (err.response?.status === 429) setError('Rate limit exceeded.');
      else setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await notificationsAPI.create({ ...form, userId: parseInt(form.userId) });
      setShowForm(false);
      setForm({ message: '', type: 'INFO', userId: '' });
      fetchNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send notification');
    }
  };

  const typeIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      default: return 'ℹ️';
    }
  };

  const typeColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS': return 'badge-success';
      case 'WARNING': return 'badge-warning';
      case 'ERROR': return 'badge-error';
      default: return 'badge-info';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">System alerts and messages</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Send Notification'}
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Send Notification</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">Type</label>
                <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="INFO">Info</option>
                  <option value="SUCCESS">Success</option>
                  <option value="WARNING">Warning</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-gray-500 mb-1">User ID</label>
                <input className="input-field" type="number" value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Message</label>
              <textarea className="input-field h-24 resize-none" value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} required
                placeholder="Enter notification message..." />
            </div>
            <button type="submit" className="btn-primary text-sm">Send</button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="glass-card p-5 flex items-start gap-4 hover:border-primary-500/20 transition-all">
            <span className="text-xl">{typeIcon(n.type)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge ${typeColor(n.type)}`}>{n.type}</span>
                <span className="text-gray-600 text-xs">User #{n.userId}</span>
              </div>
              <p className="text-gray-300 text-sm">{n.message}</p>
              <p className="text-gray-600 text-xs mt-2">{n.createdAt?.replace('T', ' ')?.split('.')[0]}</p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="glass-card p-12 text-center text-gray-600">No notifications yet</div>
        )}
      </div>
    </div>
  );
}
