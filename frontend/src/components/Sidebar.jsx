import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BrainCircuit,
  Network,
  Users as UsersIcon,
  CreditCard,
  Bell,
  Activity,
  ExternalLink,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';

const navigationGroups = [
  {
    title: 'OBSERVABILITY & ROUTING',
    items: [
      { to: '/dashboard', label: 'Gateway Telemetry', icon: LayoutDashboard, badge: 'Live' },
      { to: '/ai-optimizer', label: 'AI Optimizer', icon: BrainCircuit, badge: 'ML' },
      { to: '/topology', label: 'Mesh & Routing', icon: Network, badge: 'HA' },
    ],
  },
  {
    title: 'MICROSERVICES & ENTITIES',
    items: [
      { to: '/users', label: 'User Directory', icon: UsersIcon },
      { to: '/payments', label: 'Transactions', icon: CreditCard },
      { to: '/notifications', label: 'Dispatches', icon: Bell },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface-900/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between select-none z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-primary-500/25 border border-white/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-surface-900 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-bold text-white tracking-tight">Nexus</h1>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  Core
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider">SMART API GATEWAY</p>
            </div>
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="p-3 space-y-6">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-600/25 to-primary-600/10 text-white border border-primary-500/30 shadow-sm shadow-primary-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110 text-slate-400 group-hover:text-primary-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.07] text-slate-300 border border-white/[0.08]">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cluster Node Status & Links */}
      <div className="p-3 border-t border-white/[0.08] space-y-2">
        <div className="p-3 rounded-lg bg-surface-950/60 border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              CLUSTER MESH
            </span>
            <span className="text-emerald-400 font-mono font-medium">HEALTHY</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>Gateway Port</span>
              <span className="text-slate-200">:8080</span>
            </div>
            <div className="flex justify-between">
              <span>Rate Limiter</span>
              <span className="text-slate-200">Redis (100 RPM)</span>
            </div>
            <div className="flex justify-between">
              <span>Event Stream</span>
              <span className="text-slate-200">Kafka (Active)</span>
            </div>
          </div>
        </div>

        {/* Monitoring Links */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-slate-400 hover:text-white transition-all"
          >
            <Activity className="w-3 h-3 text-orange-400" />
            <span>Grafana</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
          <a
            href="http://localhost:9090"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-slate-400 hover:text-white transition-all"
          >
            <Server className="w-3 h-3 text-rose-400" />
            <span>Prometheus</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
      </div>
    </aside>
  );
}
