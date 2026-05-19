import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-surface-800/60 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
        <span className="text-sm text-gray-400">System Online</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user?.name}</p>
          <p className="text-[11px] text-gray-500">{user?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-sm font-bold shadow-md">
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 text-xs text-gray-500 hover:text-red-400 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
