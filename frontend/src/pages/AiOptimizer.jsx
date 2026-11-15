import { useState, useEffect } from 'react';
import { mlAPI } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Sliders,
  AlertTriangle,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function AiOptimizer() {
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Policy Form State
  const [targetType, setTargetType] = useState('IP');
  const [targetValue, setTargetValue] = useState('');
  const [limit, setLimit] = useState(50);
  const [duration, setDuration] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [predRes, anomalyRes] = await Promise.all([
        mlAPI.getPredictions(),
        mlAPI.getAnomalies(),
      ]);
      setPredictions(predRes.data);
      setAnomalies(anomalyRes.data || []);
      setError('');
    } catch {
      setError('Unable to fetch ML forecasting predictions from Gateway.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyPolicy = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setError('');

    try {
      await mlAPI.applyPolicy({
        targetType,
        targetValue: targetType === 'GLOBAL' ? '' : targetValue,
        limit: Number(limit),
        durationMinutes: Number(duration),
      });
      setSuccessMsg(`Policy active in Redis: ${targetType} ${targetValue || 'GLOBAL'} limited to ${limit} req/min for ${duration}m`);
      setTargetValue('');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch {
      setError('Failed to apply dynamic policy to Redis.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (type, value, limitVal, durationVal) => {
    setTargetType(type);
    setTargetValue(value);
    setLimit(limitVal);
    setDuration(durationVal);
    document.getElementById('policy-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center animate-spin">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-xs font-mono text-slate-400">LOADING AI INFERENCE MODELS...</p>
      </div>
    );
  }

  // Formatting chart data: historical vs predicted
  const chartData =
    predictions?.predictedTraffic?.map((t) => ({
      time: t.minute?.split(' ')[1] || t.minute,
      actual: t.isPredicted ? null : Number(t.requests),
      predicted: Number(t.requests),
      isPredicted: t.isPredicted,
    })) || [];

  const systemLoad = predictions?.systemLoadForecast || 'NORMAL';
  const growthRate = predictions?.growthRate || 0.0;
  const recommendation =
    predictions?.recommendation ||
    'Traffic trajectory is nominal. Gateway token bucket rate limits operating as configured.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            AI Traffic Optimizer & Anomaly Shield
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Scikit-Learn regression, Isolation Forest outlier filtering, and dynamic Redis traffic throttling
          </p>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Recompute Models</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* AI Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Forecasted System Load */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">LOAD PREDICTION</span>
            <span
              className={`badge ${
                systemLoad === 'CRITICAL'
                  ? 'badge-error'
                  : systemLoad === 'HIGH'
                  ? 'badge-warning'
                  : systemLoad === 'ELEVATED'
                  ? 'badge-warning'
                  : 'badge-success'
              }`}
            >
              {systemLoad}
            </span>
          </div>

          <p className="text-2xl font-bold font-mono text-white tracking-tight">
            {systemLoad}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {recommendation}
          </p>
        </div>

        {/* Traffic Growth Trajectory */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">TRAFFIC DELTA</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold font-mono tracking-tight ${
                growthRate >= 0 ? 'text-emerald-400' : 'text-slate-300'
              }`}
            >
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </p>
            <span className="text-[10px] font-mono text-slate-400">vs historical</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Evaluated by linear trend regression from trailing access logs
          </p>
        </div>

        {/* Anomalies Detected */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">ANOMALIES</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-white tracking-tight">
              {anomalies.length}
            </p>
            <span className="text-[10px] font-mono text-slate-400">incidents</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Z-score latency spikes &amp; Isolation Forest request outliers
          </p>
        </div>
      </div>

      {/* 10-Minute Traffic Predictive Model Chart */}
      <div className="control-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
              10-MINUTE CONTINUOUS TRAFFIC FORECAST
            </h3>
            <p className="text-[11px] text-slate-400">
              Blue line indicates observed historical logs; dashed pink line projects ML model expectations
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Observed</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span>Forecast</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="actualColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="predictColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
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
                dataKey="actual"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#actualColor)"
                connectNulls
                name="Observed Req"
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#ec4899"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#predictColor)"
                connectNulls
                name="ML Predicted Req"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Feed & Dynamic Policy Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anomaly Detection Feed (2 Cols) */}
        <div className="lg:col-span-2 control-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono">
                ANOMALY DETECTION &amp; SUSPECTED THREATS
              </h3>
              <p className="text-[11px] text-slate-400">
                Outlier events triggered by Z-score thresholds or unusual request bursts
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="table-header text-left">TYPE</th>
                  <th className="table-header text-left">SOURCE</th>
                  <th className="table-header text-left">SEVERITY</th>
                  <th className="table-header text-left">SCORE / METRIC</th>
                  <th className="table-header text-right">MITIGATION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {anomalies.map((anom, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-3">
                      <span
                        className={`badge ${
                          anom.anomalyType === 'LATENCY_SPIKE' ? 'badge-warning' : 'badge-error'
                        }`}
                      >
                        {anom.anomalyType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-semibold">{anom.ipAddress}</div>
                      <div className="text-[10px] text-slate-400">{anom.endpoint}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          anom.severity === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {anom.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {anom.anomalyType === 'LATENCY_SPIKE'
                        ? `${anom.responseTime}ms (z=${anom.anomalyScore})`
                        : `Density: ${anom.anomalyScore}`}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() =>
                          applyPreset(
                            'IP',
                            anom.ipAddress,
                            anom.anomalyType === 'REQUEST_FLOOD' ? 0 : 10,
                            15
                          )
                        }
                        className="btn-ghost text-[10px] border border-primary-500/30 text-primary-300"
                      >
                        {anom.anomalyType === 'REQUEST_FLOOD' ? 'Block IP' : 'Throttle'}
                      </button>
                    </td>
                  </tr>
                ))}

                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center gap-2">
                        <ShieldCheck className="w-7 h-7 text-emerald-400" />
                        <span className="text-xs text-slate-300 font-medium">All Clear — Zero Active Threat Vectors</span>
                        <span className="text-[11px] text-slate-400">
                          Isolation Forest models report normal variance within threshold limits.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Redis Policy Control (1 Col) */}
        <div id="policy-section" className="control-card p-5">
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-400" />
              Dynamic Policy Injector
            </h3>
            <p className="text-[11px] text-slate-400">
              Injects TTL-governed token bucket overrides directly into Redis
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-4 space-y-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase">One-Click Presets:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('GLOBAL', '', 50, 10)}
                className="btn-ghost text-[10px] justify-start border border-white/[0.08] text-slate-300"
              >
                Global Surge (50 RPM)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('IP', '127.0.0.1', 5, 5)}
                className="btn-ghost text-[10px] justify-start border border-white/[0.08] text-amber-300"
              >
                Test Strict Local
              </button>
            </div>
          </div>

          <form onSubmit={handleApplyPolicy} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                TARGET SCOPE
              </label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="input-field text-xs font-mono"
              >
                <option value="IP">IP Address</option>
                <option value="USER">User ID (UUID)</option>
                <option value="GLOBAL">Global Default</option>
              </select>
            </div>

            {targetType !== 'GLOBAL' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  TARGET VALUE
                </label>
                <input
                  type="text"
                  placeholder={targetType === 'IP' ? 'e.g. 192.168.1.100' : 'e.g. UUID'}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="input-field text-xs font-mono"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                MAX RATE LIMIT (REQ / MIN)
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="input-field text-xs font-mono"
                min="0"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                Set to 0 to completely block traffic from this target
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                DURATION (MINUTES)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field text-xs font-mono"
                min="1"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                Policy automatically expires via Redis key TTL
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {submitting ? 'Applying to Redis...' : 'Deploy Policy to Redis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
