import { Outlet, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  balance: number;
}

const Layout = ({ balance }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/cases', label: 'Cases', icon: '📦' },
    { path: '/inventory', label: 'Inventory', icon: '💼' },
    { path: '/history', label: 'History', icon: '📜' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen flex flex-col pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-screen-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold">NFT Case Opener</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 rounded-lg border border-primary-500/30">
            <span className="text-sm">💰</span>
            <span className="font-semibold">{balance.toFixed(2)}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-screen-md mx-auto w-full">
        <Outlet />
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
        <div className="max-w-screen-md mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                  isActive(item.path)
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
