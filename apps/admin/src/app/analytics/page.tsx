'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Smartphone, Monitor, Eye, Sparkles, CheckCircle2 } from 'lucide-react';
import { AdminShell } from '@/components/layout/admin-shell';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vj/ui';
import { api } from '@/lib/api';

export default function AdminAnalyticsPage() {
  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics', 'deep'],
    queryFn: () => api.admin.getAnalyticsOverview(),
  });

  const popularPieces = [
    { name: 'Celestial Diamond Drops', kind: 'EARRINGS', sessions: 842, conversion: '38.4%', avgDuration: '1m 42s' },
    { name: 'Royal Heritage Emerald Choker', kind: 'NECKLACES', sessions: 614, conversion: '29.1%', avgDuration: '2m 15s' },
    { name: 'Solitaire Promise Ring', kind: 'RINGS', sessions: 520, conversion: '34.0%', avgDuration: '1m 20s' },
    { name: 'Starlight Chandelier Drops', kind: 'EARRINGS', sessions: 489, conversion: '31.2%', avgDuration: '1m 50s' },
    { name: 'Eternity Platinum Band', kind: 'RINGS', sessions: 395, conversion: '26.8%', avgDuration: '1m 10s' },
  ];

  return (
    <AdminShell title="Try-On Analytics & Telemetry">
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-light text-foreground">AR Telemetry & Conversion Impact</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time telemetry measuring client camera engagement, session duration, and device class metrics.
          </p>
        </div>

        {/* Top Analytics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Avg Session Length</span>
              <CardTitle className="font-serif text-3xl font-light text-primary">1m 48s</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">+24s vs industry benchmark</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Camera Grant Rate</span>
              <CardTitle className="font-serif text-3xl font-light text-emerald-500">92.6%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">High user trust with on-device vision</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Capture Rate</span>
              <CardTitle className="font-serif text-3xl font-light text-foreground">41.8%</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Visitors snap a photo to download/save</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-xs">
            <CardHeader className="pb-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Revenue Lift</span>
              <CardTitle className="font-serif text-3xl font-light text-primary">+3.2x</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Higher order value for AR try-on shoppers</p>
            </CardContent>
          </Card>
        </div>

        {/* Device Class Breakdown */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="rounded-3xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-light">Client Device Distribution</CardTitle>
              <CardDescription className="text-xs">Webcam usage split between mobile handsets and desktop.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5"><Smartphone className="h-4 w-4 text-primary" /> Mobile (iOS Safari / Android Chrome)</span>
                  <span className="font-mono">68.4%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '68.4%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5"><Monitor className="h-4 w-4 text-muted-foreground" /> Desktop & Laptops</span>
                  <span className="font-mono">31.6%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-muted-foreground rounded-full" style={{ width: '31.6%' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border shadow-xs">
            <CardHeader>
              <CardTitle className="font-serif text-xl font-light">Vision AI Accuracy</CardTitle>
              <CardDescription className="text-xs">Real-time landmark tracking confidence metrics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Earlobe Landmark Confidence</span>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">98.2% Accurate</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Neck Contour Tracking</span>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/40">96.7% Accurate</Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Average WebGL Render FPS</span>
                <span className="font-mono font-semibold text-primary">29.4 FPS</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Pieces Tried Table */}
        <Card className="rounded-3xl border overflow-hidden shadow-xs">
          <CardHeader>
            <CardTitle className="font-serif text-xl font-light">Most Tried Jewellery Pieces</CardTitle>
            <CardDescription className="text-xs">Catalogue items generating highest customer camera engagement.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Piece</TableHead>
                  <TableHead className="text-xs">Kind</TableHead>
                  <TableHead className="text-xs">Total Sessions</TableHead>
                  <TableHead className="text-xs">Avg Duration</TableHead>
                  <TableHead className="text-xs text-right">Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularPieces.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium text-xs text-foreground">{p.name}</TableCell>
                    <TableCell className="text-xs font-mono uppercase text-muted-foreground">{p.kind}</TableCell>
                    <TableCell className="text-xs font-mono">{p.sessions.toLocaleString()}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.avgDuration}</TableCell>
                    <TableCell className="text-xs font-mono font-semibold text-primary text-right">{p.conversion}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
