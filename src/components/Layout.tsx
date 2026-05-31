import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Upload, User, Settings, Sun, Moon, Menu, X } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [dark]);

  const navItems = [
    { path: "/", label: "首页", icon: Home },
    { path: "/explore", label: "发现", icon: Search },
    { path: "/upload", label: "上传", icon: Upload },
    { path: "/profile", label: "我的", icon: User },
  ];

  const isActive = (p: string) => location.pathname === p;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Top bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-black/60 border-b border-gray-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-lg bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Confluence
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setDark(!dark)}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors md:hidden"
            >
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <Link
              to="/settings"
              className="w-9 h-9 rounded-lg items-center justify-center bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors hidden md:flex"
            >
              <Settings size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-white dark:bg-[#0a0a0f] p-4 md:hidden">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-500/10 text-blue-500"
                    : "hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">{children}</main>

      {/* Bottom nav - mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive(item.path)
                  ? "text-blue-500"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop side nav */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-60 border-r border-gray-200 dark:border-white/5 bg-white/50 dark:bg-black/30 backdrop-blur flex-col p-4">
        <div className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                isActive(item.path)
                  ? "bg-blue-500/10 text-blue-500"
                  : "hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
