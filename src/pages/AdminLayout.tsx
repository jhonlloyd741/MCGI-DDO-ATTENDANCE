import React, { useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, ScanLine, User, Lock, Eye, EyeOff } from 'lucide-react';

export function AdminLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('mcgi_admin_authenticated') === 'true';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'mcgiddo') {
      localStorage.setItem('mcgi_admin_authenticated', 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid username or password. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('mcgi_admin_authenticated');
    setIsAuthenticated(false);
  };

  const menu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'QR Scanner', path: '/admin/scanner', icon: <ScanLine size={18} /> },
    { name: 'Members', path: '/admin/members', icon: <Users size={18} /> },
    { name: 'Attendance', path: '/admin/attendance', icon: <Calendar size={18} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-bg-main flex items-center justify-center p-4 font-sans transition-colors duration-200">
        <div className="w-full max-w-md bg-bg-card rounded-2xl shadow-xl border border-border-main p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-[#0A3D91] rounded-full flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xl">MCGI</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0A3D91] dark:text-blue-400">
              DAVAO DE ORO
            </h1>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Locale & Attendance Management System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 animate-pulse text-center">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full border border-border-main p-3 pl-10 rounded-xl text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 transition-all duration-200"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <User size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full border border-border-main p-3 pl-10 pr-10 rounded-xl text-sm bg-bg-main focus:outline-none focus:ring-2 focus:ring-[#0A3D91]/20 transition-all duration-200"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                  <Lock size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0A3D91] hover:bg-[#072d6b] text-white py-3 rounded-xl font-bold transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] shadow-md flex items-center justify-center space-x-2"
            >
              <span>Access Admin Panel</span>
            </button>
          </form>

          <div className="pt-4 border-t border-border-main text-center">
            <Link
              to="/"
              className="text-xs font-bold text-text-muted hover:text-[#0A3D91] dark:hover:text-blue-400 transition-colors"
            >
              ← Back to Public Attendance Form
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-main text-text-main overflow-hidden font-sans transition-colors duration-200">
      <aside className="w-64 bg-[#0A3D91] dark:bg-[#062456] text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-[#072d6b]">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#0A3D91] font-black">MCGI</span>
            </div>
            <div>
              <h1 className="font-bold tracking-tight leading-tight text-[#FFD700]">DAVAO DE ORO</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-300">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 flex flex-col space-y-2 px-4">
          {menu.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-white/10 text-[#FFD700] font-bold shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[#072d6b]">
          <Link 
            to="/" 
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all w-full"
          >
            <LogOut size={18} />
            <span className="text-sm">Log Out</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-bg-card border-b border-border-main flex items-center justify-between px-6 shrink-0 transition-colors duration-200">
          <h2 className="font-bold text-lg">
            {menu.find(m => m.path === location.pathname)?.name || 'Admin'}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-bg-main transition-colors"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0A3D91] rounded-full text-white flex items-center justify-center font-bold text-xs">AD</div>
              <span className="text-sm font-medium">Super Admin</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
