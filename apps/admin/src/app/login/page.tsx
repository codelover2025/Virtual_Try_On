'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast,
} from '@vj/ui';
import { useAuthStore } from '@/stores/auth-store';
import { api } from '@/lib/api';
import { Sparkles, Lock, ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password });
      setSession(res.user, res.tokens);
      toast.success('Authenticated to Lumière Console');
      router.push('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid administrator credentials';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAdmin() {
    setEmail('admin@vj.local');
    setPassword('Admin@12345');
    toast.info('Default seed credentials filled');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="pointer-events-none absolute h-[400px] w-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15),transparent_70%)] blur-3xl" />

      <Card className="w-full max-w-md overflow-hidden rounded-3xl border border-primary/20 bg-card/90 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <CardTitle className="font-serif text-3xl font-light text-foreground">
            Lumière Console
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-1">
            Executive administration portal for virtual jewellery try-on and 3D calibration.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-4">
          {errorMsg ? (
            <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive text-center">
              {errorMsg}
            </div>
          ) : null}

          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail" className="text-xs uppercase tracking-wider text-muted-foreground">
                Admin Email
              </Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="admin@vj.local"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full py-6 text-sm font-medium shadow-md shadow-primary/20"
              disabled={loading}
            >
              {loading ? 'Authenticating…' : 'Access Console'}
            </Button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 rounded-2xl border bg-muted/40 p-3 text-center">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Seed Admin Credentials
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fillDemoAdmin}
              className="rounded-full text-xs h-7"
            >
              <Lock className="mr-1 h-3 w-3" /> Fill admin@vj.local
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="hover:text-primary transition">
              ← Return to Customer Storefront
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
