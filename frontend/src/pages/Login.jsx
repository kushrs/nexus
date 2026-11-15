import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Zap,
  ShieldCheck,
  BrainCircuit,
  Lock,
  Mail,
  ArrowRight,
  Activity,
  Layers,
  KeyRound,
} from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setForm({ email: 'admin@nexus.com', password: 'admin123' });
  };

  return (
    <div className="min-h-screen flex bg-surface-950 text-slate-100 relative overflow-hidden select-none">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Left Feature Showcase (Desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-surface-900/60 to-surface-950 border-r border-white/[0.08] relative z-10">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-primary-500/25 border border-white/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Nexus Gateway</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                ENTERPRISE CONTROL PLANE
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-md space-y-4">
            <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-1 rounded-full bg-primary-500/20 text-primary-300 border border-primary-500/30">
              SMART TRAFFIC OPTIMIZATION
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              AI-driven API Gateway &amp; Microservices Observability
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Equipped with token-bucket Redis rate limiting, asynchronous Kafka log streaming, machine-learning traffic forecasting, and dynamic instance load balancing.
            </p>
          </div>

          {/* Core Feature Matrix */}
          <div className="mt-8 space-y-3 max-w-sm">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs">
                <p className="text-slate-200 font-medium">JWT Gateway Security</p>
                <p className="text-slate-400 font-mono text-[10px]">Zero-trust stateless authentication</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xs">
                <p className="text-slate-200 font-medium">AI Traffic Forecasting</p>
                <p className="text-slate-400 font-mono text-[10px]">RandomForest &amp; IsolationForest ML</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xs">
                <p className="text-slate-200 font-medium">Smart Load Balancing</p>
                <p className="text-slate-400 font-mono text-[10px]">Dynamic health score instance routing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gateway Active on Port :8080</span>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Access the Nexus Gateway operations dashboard
            </p>
          </div>

          {/* Quick autofill button */}
          <button
            type="button"
            onClick={fillAdminCredentials}
            className="w-full py-2 px-3 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 text-xs font-mono text-primary-300 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary-400" />
            <span>Fill Demo Admin Credentials</span>
          </button>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="admin@nexus.com"
                  className="input-field text-xs pl-9 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                PASSWORD
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-xs pl-9 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Gateway'}
            </button>
          </form>

          <div className="pt-4 border-t border-white/[0.08] text-center">
            <p className="text-xs text-slate-400">
              Need a new account?{' '}
              <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
