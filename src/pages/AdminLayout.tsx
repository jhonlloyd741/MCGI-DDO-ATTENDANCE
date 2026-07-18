import React from 'react';
import { useTheme } from '../theme/ThemeContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Settings, LogOut, ScanLine } from 'lucide-react';

export function AdminLayout() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const menu = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={18} /> },
    { name: 'QR Scanner', path: '/admin/scanner', icon: <ScanLine size={18} /> },
    { name: 'Members', path: '/admin/members', icon: <Users size={18} /> },
    { name: 'Attendance', path: '/admin/attendance', icon: <Calendar size={18} /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={18} /> },
  ];

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
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-all w-full">
            <LogOut size={18} />
            <span className="text-sm">Exit Admin</span>
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
