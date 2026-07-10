import { Suspense, useState, type ReactNode } from 'react';
import { NavLink, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, MapPin, Clock, Loader2 } from 'lucide-react';
import { StoreSettings } from '../types';
import { sidebarItems } from '../routes';
import { useAuth } from '@/context/AuthContext';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        <p className="text-sm text-muted font-medium">Chargement...</p>
      </div>
    </div>
  );
}

interface LayoutProps {
  children: ReactNode;
  settings: StoreSettings;
}

export default function Layout({ children, settings }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const isLoginPage = location.pathname === '/login';

  if (!isLoginPage) {
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
            <p className="text-sm text-muted font-medium">Vérification de la session...</p>
          </div>
        </div>
      );
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground antialiased font-sans">
      {/* 1. Mobile Top Navbar - Sticky */}
      <div className="sticky top-0 z-40 bg-slate-900 text-white p-4 flex items-center justify-between shadow-md md:hidden shrink-0 border-b border-amber-500/20">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 p-1 rounded-lg text-slate-950 font-bold text-xs">S</div>
          <span className="font-extrabold text-sm tracking-tight font-display text-white">SUNU QUINCAILLERIE</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 hover:bg-white/10 rounded cursor-pointer">
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu backdrop overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* 2. Responsive Side Navigation Bar */}
      <aside className={`fixed md:sticky top-[56px] md:top-0 left-0 h-[calc(100vh-56px)] md:h-screen w-64 bg-slate-900 text-white shrink-0 z-30 transform transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } flex flex-col justify-between border-r border-slate-800`}>
        <div className="p-5 flex flex-col h-full justify-between">
          <div>
            {/* Store title for desktop */}
            <div className="hidden md:flex items-center space-x-2.5 pb-6 border-b border-slate-800 mb-6">
              <div className="bg-amber-500 p-1.5 rounded-xl text-slate-950 font-black text-sm shadow-xs shrink-0">
                SQ
              </div>
              <div>
                <h2 className="font-black text-sm tracking-wide font-display text-white">SUNU QUINCAILLERIE</h2>
                <span className="text-[10px] text-amber-400 font-mono block">Dakar, Sénégal</span>
              </div>
            </div>

            {/* Menu Links */}
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold transform scale-[1.02]'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <IconComp className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-500'}`} />
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom business identity block */}
          <div className="border-t border-slate-800 pt-4 mt-6">
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-[10px]">
              <div className="flex items-center space-x-1.5 text-amber-400 font-bold font-display">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                <span className="truncate">{settings.storeName}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400 font-mono">
                <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>GMT Dakar</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* 3. Main Content Viewport */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
