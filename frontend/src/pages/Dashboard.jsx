import { useState, useEffect } from 'react';
import { logsAPI } from '../services/api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

const StatCard = ({ title, value, suffix, color, icon }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>Live</span>
    </div>
    <p className="text-3xl font-bold text-white">{value}<span className="text-lg text-gray-400 ml-1">{suffix}</span></p>
    <p className="text-sm text-gray-500 mt-1">{title}</p>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await logsAPI.getDashboard();
      setStats(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit exceeded. Waiting to retry...');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  const rpmData = stats?.requestsPerMinute?.map((r) => ({
    time: r.minute?.split(' ')[1] || r.minute,
    requests: Number(r.count),
  })) || [];

  const topApisData = stats?.topApis?.map((a) => ({
    name: a.endpoint?.replace('/api/', '') || a.endpoint,
    count: Number(a.count),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Monitoring Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time API gateway metrics and analytics</p>
      </div>

      {/* Rate limit warning */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats?.totalRequests || 0} suffix="" color="bg-blue-500/20 text-blue-400" icon="📡" />
        <StatCard title="Req / Minute" value={stats?.requestsLastMinute || 0} suffix="rpm" color="bg-emerald-500/20 text-emerald-400" icon="⚡" />
        <StatCard title="Avg Response" value={stats?.avgResponseTime || 0} suffix="ms" color="bg-purple-500/20 text-purple-400" icon="⏱️" />
        <StatCard title="Error Rate" value={stats?.errorRate || 0} suffix="%" color="bg-red-500/20 text-red-400" icon="🔴" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Per Minute Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Requests Per Minute</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={rpmData}>
              <defs>
                <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" fill="url(#colorReq)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top APIs Chart */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top APIs</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topApisData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
              />
              <Bar dataKey="count" fill="#818cf8" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="table-header text-left py-3 px-4">Request ID</th>
                <th className="table-header text-left py-3 px-4">Method</th>
                <th className="table-header text-left py-3 px-4">Endpoint</th>
                <th className="table-header text-left py-3 px-4">Status</th>
                <th className="table-header text-left py-3 px-4">Time</th>
                <th className="table-header text-left py-3 px-4">User</th>
                <th className="table-header text-left py-3 px-4">IP</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentRequests?.slice(0, 15)?.map((log, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-gray-400 font-mono text-xs">{log.requestId?.substring(0, 8)}...</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${
                      log.method === 'GET' ? 'badge-info' :
                      log.method === 'POST' ? 'badge-success' :
                      log.method === 'DELETE' ? 'badge-error' : 'badge-warning'
                    }`}>{log.method}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{log.endpoint}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${log.statusCode < 400 ? 'badge-success' : 'badge-error'}`}>
                      {log.statusCode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{log.responseTime}ms</td>
                  <td className="py-3 px-4 text-gray-400">{log.userId || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{log.ipAddress}</td>
                </tr>
              ))}
              {(!stats?.recentRequests || stats.recentRequests.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-600">
                    No requests logged yet. Start making API calls!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
