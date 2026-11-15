import { useState, useEffect, useMemo } from 'react';
import { logsAPI } from '../services/api';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  X,
  Server,
  Shield,
  Layers,
  Terminal,
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Explorer filters & inspection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [copiedId, setCopiedId] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(15); // seconds
  const [countdown, setCountdown] = useState(15);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await logsAPI.getDashboard();
      setStats(res.data);
      setError('');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Rate limit reached (100 req/min). Gateway token-bucket active.');
      } else {
        setError('Failed to reach Gateway log consumer.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Interval timer & countdown
  useEffect(() => {
    if (refreshInterval === 0) return;
    setCountdown(refreshInterval);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStats();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Chart data formatting
  const rpmData = useMemo(() => {
    if (!stats?.requestsPerMinute) return [];
    return stats.requestsPerMinute.map((r) => ({
      time: r.minute?.split(' ')[1] || r.minute,
      requests: Number(r.count),
    }));
  }, [stats]);

  const topApisData = useMemo(() => {
    if (!stats?.topApis) return [];
    return stats.topApis.map((a) => ({
      name: a.endpoint?.replace('/api/', '') || a.endpoint,
      count: Number(a.count),
    }));
  }, [stats]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    if (!stats?.recentRequests) return [];
    return stats.recentRequests.filter((log) => {
      const matchesSearch =
        !searchQuery ||
        log.requestId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.endpoint?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ipAddress?.includes(searchQuery) ||
        (log.userId && log.userId.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMethod = selectedMethod === 'ALL' || log.method === selectedMethod;

      let matchesStatus = true;
      if (selectedStatus === '2xx') matchesStatus = log.statusCode >= 200 && log.statusCode < 300;
      else if (selectedStatus === '4xx') matchesStatus = log.statusCode >= 400 && log.statusCode < 500;
      else if (selectedStatus === '5xx') matchesStatus = log.statusCode >= 500;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [stats, searchQuery, selectedMethod, selectedStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-primary-600/20 border border-primary-500/40 flex items-center justify-center animate-spin">
            <RefreshCw className="w-6 h-6 text-primary-400" />
          </div>
        </div>
        <p className="text-xs font-mono text-slate-400">CONNECTING TO GATEWAY MESH...</p>
      </div>
    );
  }

  const errorRateNum = parseFloat(stats?.errorRate || '0.0');

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-400" />
            Gateway Live Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time ingress logs, request distribution, and upstream microservice performance
          </p>
        </div>

        {/* Refresh controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-900 border border-white/[0.08] text-xs font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Poll:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent border-0 text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              <option value={5} className="bg-surface-900">5s</option>
              <option value={15} className="bg-surface-900">15s</option>
              <option value={30} className="bg-surface-900">30s</option>
              <option value={0} className="bg-surface-900">Paused</option>
            </select>
            {refreshInterval > 0 && (
              <span className="text-[10px] text-slate-500">({countdown}s)</span>
            )}
          </div>

          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="btn-secondary text-xs py-1.5 px-3"
            title="Force refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Rate Limit Warning Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ingress Requests */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">TOTAL INGRESS</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-white tracking-tight">
              {(stats?.totalRequests || 0).toLocaleString()}
            </p>
            <span className="text-[10px] font-mono text-slate-400">calls</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <ArrowUpRight className="w-3 h-3" />
            <span>Persisted via Kafka</span>
          </div>
        </div>

        {/* Throughput (RPM) */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">THROUGHPUT</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats?.requestsLastMinute || 0}
            </p>
            <span className="text-[10px] font-mono text-slate-400">req/min</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono">
            Cap: <span className="text-slate-300">100 RPM / IP</span>
          </div>
        </div>

        {/* Response Latency */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">AVG LATENCY</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats?.avgResponseTime || 0}
            </p>
            <span className="text-[10px] font-mono text-slate-400">ms</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
            <span>High performance &lt; 50ms</span>
          </div>
        </div>

        {/* Error Rate */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">ERROR RATE</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${
              errorRateNum > 5
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-white tracking-tight">
              {stats?.errorRate || '0.0'}%
            </p>
            <span className="text-[10px] font-mono text-slate-400">non-2xx</span>
          </div>
          <div className="mt-2 text-[11px] font-mono text-slate-400">
            SLO Target: <span className="text-emerald-400 font-semibold">&gt; 99.0% SLA</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time RPM Timeline (2 Cols) */}
        <div className="lg:col-span-2 control-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
                TRAFFIC VELOCITY (ROLLING RPM)
              </h3>
              <p className="text-[11px] text-slate-400">Gateway ingress rate sampled every 60s</p>
            </div>
            <span className="badge badge-info text-[10px] font-mono">Kafka Offset Linked</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rpmData}>
                <defs>
                  <linearGradient id="rpmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#rpmGrad)"
                  name="Requests/min"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Endpoints Bar Chart (1 Col) */}
        <div className="control-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
                TOP ROUTED ENDPOINTS
              </h3>
              <p className="text-[11px] text-slate-400">Total volume distribution</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topApisData} layout="vertical">
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} name="Hits" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Live Request Explorer Table */}
      <div className="control-card overflow-hidden">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 border-b border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-950/40">
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-400" />
              Ingress Request Inspector ({filteredRequests.length} events)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click any log record to inspect raw gateway headers, upstream service latency, and routing path
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, endpoint, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field text-xs pl-8 py-1.5 w-48 font-mono"
              />
            </div>

            {/* Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-surface-900 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
            >
              <option value="ALL">Method: ALL</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-surface-900 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none font-mono"
            >
              <option value="ALL">Status: ALL</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Err</option>
              <option value="5xx">5xx Server Err</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="table-header text-left">REQUEST ID</th>
                <th className="table-header text-left">METHOD</th>
                <th className="table-header text-left">ENDPOINT</th>
                <th className="table-header text-left">STATUS</th>
                <th className="table-header text-left">LATENCY</th>
                <th className="table-header text-left">USER ID</th>
                <th className="table-header text-left">CLIENT IP</th>
                <th className="table-header text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono">
              {filteredRequests.slice(0, 20).map((log, i) => {
                const isSelected = selectedRequest?.requestId === log.requestId;
                const isCopied = copiedId === log.requestId;

                return (
                  <tr
                    key={log.requestId || i}
                    onClick={() => setSelectedRequest(log)}
                    className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary-500/10' : ''
                    }`}
                  >
                    {/* Request ID */}
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>{log.requestId?.substring(0, 8)}...</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(log.requestId, log.requestId);
                          }}
                          className="text-slate-400 hover:text-white p-0.5"
                          title="Copy full UUID"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          log.method === 'GET'
                            ? 'badge-info'
                            : log.method === 'POST'
                            ? 'badge-success'
                            : log.method === 'DELETE'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {log.method}
                      </span>
                    </td>

                    {/* Endpoint */}
                    <td className="py-3 px-4 text-slate-200 font-semibold">{log.endpoint}</td>

                    {/* Status Code */}
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          log.statusCode < 400
                            ? 'badge-success'
                            : log.statusCode === 429
                            ? 'badge-warning'
                            : 'badge-error'
                        }`}
                      >
                        {log.statusCode} {log.statusCode === 200 ? 'OK' : log.statusCode === 429 ? 'RATE LIMIT' : ''}
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4">
                      <span
                        className={
                          log.responseTime < 50
                            ? 'text-emerald-400'
                            : log.responseTime < 200
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }
                      >
                        {log.responseTime}ms
                      </span>
                    </td>

                    {/* User ID */}
                    <td className="py-3 px-4 text-slate-400">
                      {log.userId ? `${log.userId.substring(0, 8)}...` : 'ANONYMOUS'}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 text-slate-400">{log.ipAddress || '127.0.0.1'}</td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                );
              })}

              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No requests matching the selected filters. Use the "Burst Test" button in the header to generate live logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Request Details Modal/Drawer */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg h-full bg-surface-900 border-l border-white/[0.1] p-6 flex flex-col justify-between overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-200">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary-400" />
                  <h3 className="text-sm font-semibold text-white font-mono">REQUEST INSPECTOR</h3>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Request Metadata Cards */}
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-surface-950/80 border border-white/[0.06] space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request ID</span>
                    <span className="text-slate-200 select-all">{selectedRequest.requestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Method</span>
                    <span className="text-primary-400 font-bold">{selectedRequest.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Path</span>
                    <span className="text-slate-200 font-semibold">{selectedRequest.endpoint}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">HTTP Status</span>
                    <span className={selectedRequest.statusCode < 400 ? 'text-emerald-400' : 'text-rose-400'}>
                      {selectedRequest.statusCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gateway Latency</span>
                    <span className="text-slate-200">{selectedRequest.responseTime} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client IP</span>
                    <span className="text-slate-200">{selectedRequest.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Authenticated User</span>
                    <span className="text-slate-200">{selectedRequest.userId || 'None (Public / Anonymous)'}</span>
                  </div>
                </div>

                {/* Raw JSON viewer */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400 uppercase">RAW LOG EVENT (KAFKA JSON)</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(selectedRequest, null, 2), 'raw')}
                      className="btn-ghost text-[10px]"
                    >
                      {copiedId === 'raw' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy JSON</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-lg bg-surface-950 text-[11px] font-mono text-slate-300 overflow-x-auto border border-white/[0.06]">
                    {JSON.stringify(selectedRequest, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <button
                onClick={() => setSelectedRequest(null)}
                className="w-full btn-secondary text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
