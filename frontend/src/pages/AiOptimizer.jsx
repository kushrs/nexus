import { useState, useEffect } from 'react';
import { mlAPI } from '../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function AiOptimizer() {
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Policy Form State
  const [targetType, setTargetType] = useState('IP');
  const [targetValue, setTargetValue] = useState('');
  const [limit, setLimit] = useState(50);
  const [duration, setDuration] = useState(15);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      const predRes = await mlAPI.getPredictions();
      const anomalyRes = await mlAPI.getAnomalies();
      setPredictions(predRes.data);
      setAnomalies(anomalyRes.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch AI optimizer metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
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
        durationMinutes: Number(duration)
      });
      setSuccessMsg('Optimization policy applied successfully in Redis!');
      setTargetValue('');
      fetchData();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setError('Failed to apply dynamic policy');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickPolicy = (type, value, suggestedLimit) => {
    setTargetType(type);
    setTargetValue(value);
    setLimit(suggestedLimit);
    setDuration(15);
    
    // Smooth scroll to form
    document.getElementById('policy-form-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  // Formatting chart data: historical vs predicted
  const chartData = predictions?.predictedTraffic?.map((t) => ({
    time: t.minute?.split(' ')[1] || t.minute,
    actual: t.isPredicted ? null : Number(t.requests),
    predicted: Number(t.requests),
    isPredicted: t.isPredicted
  })) || [];

  const systemLoad = predictions?.systemLoadForecast || 'NORMAL';
  const growthRate = predictions?.growthRate || 0.0;
  const recommendation = predictions?.recommendation || 'No action needed.';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🤖 AI Traffic Optimizer
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Predictive traffic shaping, real-time Z-score anomaly detection, and dynamic rate limit configuration
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          ✨ {successMsg}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Forecasted System Load</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-3.5 h-3.5 rounded-full animate-pulse ${
              systemLoad === 'CRITICAL' ? 'bg-red-500' :
              systemLoad === 'HIGH' ? 'bg-orange-500' :
              systemLoad === 'ELEVATED' ? 'bg-yellow-500' : 'bg-emerald-500'
            }`}></span>
            <p className="text-2xl font-bold text-white">{systemLoad}</p>
          </div>
          <p className="text-xs text-gray-400 mt-3">{recommendation}</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Traffic Trend (Growth)</p>
          <p className={`text-3xl font-bold mt-2 ${growthRate >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {growthRate >= 0 ? '+' : ''}{growthRate}%
          </p>
          <p className="text-xs text-gray-400 mt-3">Calculated compared to trailing historical logs.</p>
        </div>

        <div className="stat-card">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Detected Anomalies</p>
          <p className="text-3xl font-bold text-white mt-2">{anomalies.length}</p>
          <p className="text-xs text-gray-400 mt-3">Suspected security threats, DDoS, or system lags.</p>
        </div>
      </div>

      {/* Forecasting Chart */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">10-Minute Traffic Predictive Model</h3>
            <p className="text-xs text-gray-500 mt-0.5">Continuous mathematical linear regression forecasting</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Actual Traffic
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-3 h-3 bg-indigo-500/30 border border-indigo-500/80 border-dashed rounded-sm"></span> Predicted Spike
            </span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPredict" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
              labelStyle={{ color: '#94a3b8' }}
            />
            {/* Split historical vs future visual styling */}
            <Area type="monotone" dataKey="actual" stroke="#6366f1" fill="url(#colorActual)" strokeWidth={2} connectNulls />
            <Area type="monotone" dataKey="predicted" stroke="#ec4899" fill="url(#colorPredict)" strokeWidth={2} strokeDasharray="5 5" connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time Anomalies Log */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Real-time Anomaly Detection Log (Z-Score)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="table-header text-left py-3 px-2">Type</th>
                  <th className="table-header text-left py-3 px-2">Source</th>
                  <th className="table-header text-left py-3 px-2">Severity</th>
                  <th className="table-header text-left py-3 px-2">Metric</th>
                  <th className="table-header text-left py-3 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anom, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2">
                      <span className={`badge ${
                        anom.anomalyType === 'LATENCY_SPIKE' ? 'badge-warning' : 'badge-error'
                      }`}>{anom.anomalyType}</span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="text-gray-300 font-mono text-xs">{anom.ipAddress}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{anom.endpoint}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        anom.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{anom.severity}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-400 font-mono text-xs">
                      {anom.anomalyType === 'LATENCY_SPIKE' ? `${anom.responseTime}ms (z=${anom.anomalyScore})` : `Density count: ${anom.anomalyScore}`}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => fillQuickPolicy(
                          anom.anomalyType === 'LATENCY_SPIKE' ? 'IP' : 'IP',
                          anom.ipAddress,
                          anom.anomalyType === 'REQUEST_FLOOD' ? 0 : 10
                        )}
                        className="px-2.5 py-1 rounded bg-primary-600/30 text-primary-400 border border-primary-500/20 text-xs hover:bg-primary-600 hover:text-white transition-all"
                      >
                        {anom.anomalyType === 'REQUEST_FLOOD' ? 'Block IP' : 'Throttle'}
                      </button>
                    </td>
                  </tr>
                ))}
                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-600">
                      🟢 All clear! No active traffic anomalies detected in recent logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Optimization Policy Panel */}
        <div id="policy-form-section" className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-1">Apply Traffic Policy</h3>
          <p className="text-xs text-gray-500 mb-4">Modify Redis rate-limit configuration dynamically</p>
          
          <form onSubmit={handleApplyPolicy} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Target Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="input-field"
              >
                <option value="IP">IP Address</option>
                <option value="USER">User ID</option>
                <option value="GLOBAL">Global Default</option>
              </select>
            </div>

            {targetType !== 'GLOBAL' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Target Value</label>
                <input
                  type="text"
                  placeholder={targetType === 'IP' ? 'e.g. 192.168.1.5' : 'e.g. 1'}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Rate Limit (req/min)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="input-field"
                min="0"
                required
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Set to 0 to block access completely</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Duration (minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
                min="1"
                placeholder="15"
                required
              />
              <span className="text-[10px] text-gray-500 mt-1 block">Policy expires and reverts after this time</span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg shadow-primary-500/20 hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 text-sm mt-2"
            >
              {submitting ? 'Applying...' : 'Apply Rules to Redis'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
