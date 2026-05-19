import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-surface-800/80 backdrop-blur-xl border-r border-white/[0.06] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-lg font-bold shadow-lg shadow-primary-500/30">
            N
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Nexus</h1>
            <p className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">API Gateway</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20 shadow-sm shadow-primary-500/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Phase 1–4</p>
          <p className="text-xs text-gray-400 mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
