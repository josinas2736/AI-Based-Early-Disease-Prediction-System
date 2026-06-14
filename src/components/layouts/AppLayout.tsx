import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Brain,
  ClipboardList,
  GitCompare,
  Heart,
  Home,
  Menu,
  Wind,
  Zap,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/predict/diabetes', label: 'Diabetes', icon: Activity },
  { path: '/predict/heart', label: 'Heart Disease', icon: Heart },
  { path: '/predict/pcos', label: 'PCOS', icon: Zap },
  { path: '/predict/stress', label: 'Stress / Anxiety', icon: Brain },
  { path: '/history', label: 'Patient History', icon: ClipboardList },
  { path: '/compare', label: 'Comparative Analysis', icon: GitCompare },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0">
          <Wind className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-sidebar-foreground leading-tight truncate">AI Disease</p>
          <p className="text-xs text-sidebar-foreground/60 truncate">Prediction System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Predictions
        </p>
        <div className="space-y-0.5">
          {navItems.slice(0, 5).map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>

        <p className="px-3 mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Analytics
        </p>
        <div className="space-y-0.5">
          {navItems.slice(5).map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer badge */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent px-3 py-2">
          <p className="text-xs font-medium text-sidebar-accent-foreground">XAI Research Platform</p>
          <p className="text-xs text-sidebar-foreground/50 mt-0.5">IEEE-Grade Explainability</p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const currentNav = navItems.find((n) =>
    n.path === '/' ? location.pathname === '/' : location.pathname.startsWith(n.path)
  );

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {/* Top header */}
        <header className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-border bg-background/95 backdrop-blur shrink-0">
          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden shrink-0">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border" aria-label="Navigation menu">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate text-foreground">
              {currentNav?.label ?? 'AI Disease Prediction'}
            </h1>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              ML Model Active
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
