import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { usersAPI } from '../services/api';

const routeTitles = {
  '/dashboard': { title: 'Gateway Telemetry', subtitle: 'Real-time traffic throughput, p99 latency & access logs' },
  '/ai-optimizer': { title: 'AI Traffic Optimizer', subtitle: 'Predictive traffic modeling, isolation forest anomaly defense' },
  '/topology': { title: 'Mesh Topology & Health', subtitle: 'Smart routing instance discovery & failover health matrix' },
  '/users': { title: 'User Management', subtitle: 'Provisioned identity accounts & role assignments' },
  '/payments': { title: 'Transactions Ledger', subtitle: 'Microservice transaction records & status states' },
  '/notifications': { title: 'Dispatches & Alerts', subtitle: 'Event notifications broadcast pipeline' },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [simulating, setSimulating] = useState(false);
  const [simMessage, setSimMessage] = useState('');

  const currentMeta = routeTitles[location.pathname] || {
    title: 'Control Plane',
    subtitle: 'Nexus Gateway Services',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Quick simulation trigger: sends 5 requests to generate immediate live telemetry!
  const triggerTrafficBurst = async () => {
    setSimulating(true);
    setSimMessage('Sending traffic burst...');
    try {
      const promises = [1, 2, 3, 4, 5].map(() => usersAPI.getAll().catch(() => {}));
      await Promise.all(promises);
      setSimMessage('5 Requests routed!');
      setTimeout(() => setSimMessage(''), 3000);
    } catch {
      setSimMessage('Burst sent');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header className="h-16 bg-surface-900/80 backdrop-blur-xl border-b border-white/[0.08] flex items-center justify-between px-6 z-10">
      {/* Route context */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
            {currentMeta.title}
          </h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Action Controls & User */}
      <div className="flex items-center gap-3">
        {/* Quick Traffic Generator */}
        <button
          onClick={triggerTrafficBurst}
          disabled={simulating}
          title="Fires a 5-request burst through the gateway to generate live telemetry"
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-mono font-medium transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap className={`w-3.5 h-3.5 text-primary-400 ${simulating ? 'animate-bounce' : ''}`} />
          <span>{simMessage || 'Burst Test (5 Req)'}</span>
        </button>

        {/* Gateway Health Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-950/80 border border-white/[0.08] text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>GW: 8080</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">p50 &lt;10ms</span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md border border-white/20">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-medium text-slate-200">{user?.name || 'Administrator'}</p>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-primary-400 font-semibold">{user?.role || 'USER'}</span>
                <span className="text-[10px] text-slate-500">• {user?.email}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of control plane"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
