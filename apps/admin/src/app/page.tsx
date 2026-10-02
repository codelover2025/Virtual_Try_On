'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Camera,
  FolderTree,
  Gem,
  Plus,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@vj/ui';
import { AdminShell } from '@/components/layout/admin-shell';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const analyticsQuery = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.admin.getAnalyticsOverview(),
  });

  const productsQuery = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.catalog.listProducts({ pageSize: 5 }),
  });

  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.catalog.listCategories({ flat: true }),
  });

  const stats = [
    {
      title: 'Active Try-On Sessions',
      value: '248',
      change: '+18.4% this week',
      icon: Camera,
      color: 'text-primary',
    },
    {
      title: 'Published Pieces',
      value: productsQuery.data?.pagination?.total?.toString() ?? '18',
      change: '100% AR Ready',
      icon: Gem,
      color: 'text-emerald-500',
    },
    {
      title: 'Atelier Categories',
      value: categoriesQuery.data?.length?.toString() ?? '6',
      change: 'Across all collections',
      icon: FolderTree,
      color: 'text-amber-500',
    },
    {
      title: 'Try-On Conversion Rate',
      value: '34.2%',
      change: '+6.1% vs static PDP',
      icon: TrendingUp,
      color: 'text-primary',
    },
  ];

  return (
    <AdminShell title="Executive Overview">
      <div className="space-y-8">
        {/* Welcome & Quick Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-background to-secondary p-6 sm:p-8 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                LUMIÈRE EXECUTIVE
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Live Atelier Hub</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
              Virtual Try-On Command Center
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time monitoring of customer camera sessions, AR 3D assets, and fine jewellery catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild size="sm" className="rounded-full gap-1.5 shadow-sm">
              <Link href="/products">
                <Plus className="h-4 w-4" /> Add Product
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5">
              <Link href="/assets">
                <Upload className="h-4 w-4" /> Upload 3D Asset
              </Link>
            </Button>
          </div>
        </div>

        {/* Metric KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="rounded-3xl border shadow-xs hover:border-primary/40 transition">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {s.title}
                  </span>
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-serif text-3xl font-normal text-foreground">{s.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    <span>{s.change}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Catalogue & Quick Asset Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main 2-column: Catalogue Overview Table */}
          <Card className="rounded-3xl border lg:col-span-2 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="font-serif text-xl font-light">Showroom Catalogue Status</CardTitle>
                <CardDescription className="text-xs">
                  Recently updated pieces and their real-time virtual fitting status.
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-xs text-primary">
                <Link href="/products">View All Products →</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {productsQuery.isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Piece</TableHead>
                      <TableHead className="text-xs">Kind</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Try-On Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsQuery.data?.items?.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs">
                          <div className="flex items-center gap-2.5">
                            {p.primaryImage?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.primaryImage.url} alt={p.name} className="h-8 w-8 rounded-lg object-cover border" />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-[10px]">✦</div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground line-clamp-1">{p.name}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">{p.sku}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs uppercase font-mono text-muted-foreground">
                          {p.jewelleryKind.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 text-[10px]">
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs rounded-full">
                            <a href={`http://localhost:3000/try-on/${p.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-3.5 w-3.5 mr-1 text-primary" /> Test AR
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Right column: AR Calibration Diagnostic */}
          <Card className="rounded-3xl border shadow-xs space-y-4">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-4 w-4" />
                <span>AR Engine Specs</span>
              </div>
              <CardTitle className="font-serif text-xl font-light">Sensors & Anchors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Computer Vision Detector</span>
                  <Badge variant="secondary" className="text-[10px]">BlazeFace / TF.js</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Multi-point facial contour detector with sub-millimeter earlobe orientation tracking.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">3D Renderer</span>
                  <Badge variant="secondary" className="text-[10px]">Three.js WebGL</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  PBR metallic roughness shaders with dynamic lighting reflections for diamonds and gold.
                </p>
              </div>

              <div className="rounded-2xl border bg-muted/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">Storage Backend</span>
                  <Badge variant="secondary" className="text-[10px]">MinIO / S3</Badge>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Presigned capture uploads and encrypted portrait storage with automatic thumb generation.
                </p>
              </div>

              <Button asChild variant="outline" size="sm" className="w-full rounded-full text-xs">
                <Link href="/settings">Configure Engine Parameters →</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
