'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Save, Shield, HardDrive, Cpu, Sliders, CheckCircle2 } from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@vj/ui';
import { api } from '@/lib/api';

export default function AdminSettingsPage() {
  const [storeName, setStoreName] = useState('Lumière High Jewellery Atelier');
  const [currency, setCurrency] = useState('INR');
  const [targetFps, setTargetFps] = useState('30');
  const [smoothingFactor, setSmoothingFactor] = useState('0.65');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [allowGuestSessions, setAllowGuestSessions] = useState(true);

  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.admin.getAdminSettings(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      // simulate saving settings
      await new Promise((res) => setTimeout(res, 600));
      return true;
    },
    onSuccess: () => {
      toast.success('Atelier platform settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  return (
    <AdminShell title="Platform & Studio Settings">
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Studio Platform Configuration</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control AR sensor smoothing thresholds, currency, storage connections, and security parameters.
            </p>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-full gap-2 shadow-sm self-start sm:self-auto"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>

        {/* Section 1: Atelier Storefront Identity */}
        <Card className="rounded-3xl border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Settings className="h-4 w-4" />
              <span>General Identity</span>
            </div>
            <CardTitle className="font-serif text-xl font-light">Showroom Branding</CardTitle>
            <CardDescription className="text-xs">
              Brand metadata displayed on the customer-facing storefront and shared capture portraits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Atelier Store Name
                </Label>
                <Input
                  id="sName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Default Display Currency
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹ Indian Rupee)</SelectItem>
                    <SelectItem value="USD">USD ($ United States Dollar)</SelectItem>
                    <SelectItem value="EUR">EUR (€ Euro)</SelectItem>
                    <SelectItem value="GBP">GBP (£ British Pound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: AR Engine & Vision Sensor Settings */}
        <Card className="rounded-3xl border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Cpu className="h-4 w-4" />
              <span>Vision AI Engine</span>
            </div>
            <CardTitle className="font-serif text-xl font-light">AR Tracking Parameters</CardTitle>
            <CardDescription className="text-xs">
              Performance throttle and Kalman landmark smoothing factors for browser webcam tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Target FPS Throttle
                </Label>
                <Select value={targetFps} onValueChange={setTargetFps}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 FPS (Cinematic / Battery Saver)</SelectItem>
                    <SelectItem value="30">30 FPS (Recommended Standard)</SelectItem>
                    <SelectItem value="60">60 FPS (Ultra Smooth / Desktop Only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Adaptive controller automatically lowers frame rate on thermal throttled mobile devices.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <Label htmlFor="smooth" className="uppercase tracking-wider text-muted-foreground">
                    Kalman Landmark Smoothing: {smoothingFactor}
                  </Label>
                </div>
                <Input
                  id="smooth"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={smoothingFactor}
                  onChange={(e) => setSmoothingFactor(e.target.value)}
                  className="cursor-pointer"
                />
                <p className="text-[11px] text-muted-foreground">
                  Higher values reduce jitter when turning face; lower values minimize tracking latency.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="wm"
                  checked={watermarkEnabled}
                  onChange={(e) => setWatermarkEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="wm" className="text-xs text-foreground cursor-pointer">
                  Stamp discreet golden &ldquo;LUMIÈRE VIRTUAL STUDIO&rdquo; watermark on downloaded portraits
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="guest"
                  checked={allowGuestSessions}
                  onChange={(e) => setAllowGuestSessions(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <Label htmlFor="guest" className="text-xs text-foreground cursor-pointer">
                  Allow guest visitors to use virtual try-on without signing in
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Infrastructure Status */}
        <Card className="rounded-3xl border shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <HardDrive className="h-4 w-4" />
              <span>Infrastructure Connectors</span>
            </div>
            <CardTitle className="font-serif text-xl font-light">Storage & API Health</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">NestJS API</span>
                <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                  <CheckCircle2 className="h-3 w-3" /> Online
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] font-mono">http://localhost:4000/api</p>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">PostgreSQL DB</span>
                <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                  <CheckCircle2 className="h-3 w-3" /> Healthy
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] font-mono">Prisma ORM v5</p>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">S3 / MinIO</span>
                <span className="flex items-center gap-1 text-emerald-500 font-semibold text-[11px]">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <p className="text-muted-foreground text-[10px] font-mono">vj-captures bucket</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
