'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  FolderTree,
  Gem,
  LayoutDashboard,
  LogOut,
  Settings,
  Upload,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { cn, Button } from '@vj/ui';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';

export const adminNavItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Gem },
  { href: '/categories', label: 'Categories', icon: FolderTree },
  { href: '/assets', label: 'Upload Jewellery', icon: Upload },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);

  async function logout() {
    const refresh = useAuthStore.getState().refreshToken;
    clearSession();
    if (refresh) {
      try {
        await api.auth.logout(refresh);
      } catch {
        /* ignore */
      }
    }
    router.push('/login');
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card/95 backdrop-blur-md">
      {/* Brand Header */}
      <div className="flex items-center gap-3 border-b p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Atelier Console</p>
          <p className="font-serif text-base font-medium text-foreground">Lumière Studio</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 space-y-1.5 p-3" aria-label="Admin Navigation">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => onNavigate?.()}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all duration-150',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Link to Customer Storefront */}
      <div className="px-3 py-2">
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition hover:border-primary/40"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5 text-primary" />
            <span>Storefront Studio</span>
          </span>
          <span className="text-[10px] font-mono text-primary font-semibold">:3000</span>
        </a>
      </div>

      {/* Footer / Logout */}
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] text-muted-foreground font-mono">Backend Connected</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start rounded-xl text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void logout()}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );
}
