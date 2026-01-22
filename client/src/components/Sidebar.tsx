import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  History,
  GraduationCap,
  LogOut,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/portfolio', icon: Briefcase, label: 'Portfolio' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/learn', icon: GraduationCap, label: 'Learn' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { portfolios, activePortfolio, setActivePortfolio } = usePortfolio();
  const [showPortfolioDropdown, setShowPortfolioDropdown] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl text-gray-900">TradeSim</span>
        </div>
      </div>

      {/* Portfolio Switcher */}
      {portfolios.length > 0 && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="relative">
            <button
              onClick={() => setShowPortfolioDropdown(!showPortfolioDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
                <p className="text-xs text-gray-500 font-medium">Active Portfolio</p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {activePortfolio?.name || 'Select Portfolio'}
                </p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  showPortfolioDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showPortfolioDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                {portfolios.map((portfolio) => (
                  <button
                    key={portfolio.id}
                    onClick={() => {
                      setActivePortfolio(portfolio);
                      setShowPortfolioDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                      activePortfolio?.id === portfolio.id
                        ? 'text-brand-600 font-medium bg-brand-50'
                        : 'text-gray-700'
                    }`}
                  >
                    {portfolio.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-brand-700">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'User'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
