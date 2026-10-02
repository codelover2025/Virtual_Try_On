'use client';

import { useState, type ReactNode } from 'react';
import { Menu, Moon, Sun, Search, User, ShieldCheck } from 'lucide-react';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@vj/ui';
import { AdminSidebar } from './admin-sidebar';
import { useAuthStore } from '@/stores/auth-store';

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  function toggleTheme() {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    window.localStorage.setItem('vj-theme', next ? 'dark' : 'light');
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Administrative Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-card/60 px-4 sm:px-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden rounded-xl">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SheetHeader className="sr-only">
                  <SheetTitle>Admin Navigation</SheetTitle>
                </SheetHeader>
                <AdminSidebar onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="font-serif text-lg font-medium text-foreground">{title ?? 'Dashboard'}</h1>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Toggle theme"
            >
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Admin User Badge */}
            <div className="flex items-center gap-2 rounded-full border border-border/80 bg-background/80 py-1 px-3 shadow-xs">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                {user?.fullName ? user.fullName[0]?.toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:block text-left text-xs leading-none">
                <span className="font-medium text-foreground block">{user?.fullName ?? 'Administrator'}</span>
                <span className="text-[10px] text-primary uppercase font-mono tracking-wider">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
