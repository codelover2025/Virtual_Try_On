'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JewelleryKind, ProductStatus } from '@vj/shared';
import {
  Plus,
  Search,
  Gem,
  MoreVertical,
  CheckCircle,
  Eye,
  Trash2,
  Edit,
  Sparkles,
} from 'lucide-react';
import {
  AdminShell,
} from '@/components/layout/admin-shell';
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
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  EmptyState,
  formatPrice,
  toast,
} from '@vj/ui';
import { api } from '@/lib/api';
import type { ProductDetailDto, CategoryDto } from '@vj/types';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductDetailDto | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State for New Product
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [kind, setKind] = useState<JewelleryKind>(JewelleryKind.EARRINGS);
  const [priceCents, setPriceCents] = useState('7500000');
  const [currency, setCurrency] = useState('INR');

  // Load products
  const productsQuery = useQuery({
    queryKey: ['admin', 'products', 'list', search, selectedKind],
    queryFn: () =>
      api.catalog.listProducts({
        q: search || undefined,
        jewelleryKind: selectedKind !== 'all' ? (selectedKind as JewelleryKind) : undefined,
        pageSize: 50,
      }),
  });

  // Load categories for selector
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'flat'],
    queryFn: () => api.catalog.listCategories({ flat: true }),
  });

  // Create Product Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!categoryId) throw new Error('Please select a category');
      return api.admin.createProduct({
        categoryId,
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim() || undefined,
        jewelleryKind: kind,
        status: ProductStatus.PUBLISHED,
        priceCents: parseInt(priceCents, 10) || 0,
        currency,
      });
    },
    onSuccess: () => {
      toast.success('Piece created and published in showroom');
      setCreateOpen(false);
      resetForm();
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not create product');
    },
  });

  // Publish Product Mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) => api.admin.publishProduct(id),
    onSuccess: () => {
      toast.success('Piece published');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Could not publish piece'),
  });

  // Delete Product Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteProduct(id),
    onSuccess: () => {
      toast.success('Piece removed from catalogue');
      setDeleteConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: () => toast.error('Could not delete piece'),
  });

  function resetForm() {
    setName('');
    setSku('');
    setSlug('');
    setDescription('');
    setCategoryId('');
    setKind(JewelleryKind.EARRINGS);
    setPriceCents('7500000');
  }

  const items = productsQuery.data?.items ?? [];

  return (
    <AdminShell title="Product Catalogue Management">
      <div className="space-y-6">
        {/* Top Header & New Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Fine Jewellery Inventory</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage pieces, virtual try-on assets, pricing, and showcase status.
            </p>
          </div>

          <Button onClick={() => setCreateOpen(true)} className="rounded-full gap-2 shadow-sm self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Add New Piece
          </Button>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border bg-card p-3 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, SKU, or gem type…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-none bg-muted/40 focus-visible:bg-transparent"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={selectedKind} onValueChange={setSelectedKind}>
              <SelectTrigger className="w-[160px] rounded-xl text-xs">
                <SelectValue placeholder="All Kinds" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jewellery Kinds</SelectItem>
                {Object.values(JewelleryKind).map((k) => (
                  <SelectItem key={k} value={k}>
                    {k.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap pl-2">
              {items.length} pieces
            </span>
          </div>
        </div>

        {/* Products Data Table */}
        <Card className="rounded-3xl border overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {productsQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                title="No pieces match your query"
                description="Try refining your search or add a new piece to the collection."
                action={
                  <Button onClick={() => setCreateOpen(true)} className="rounded-full">
                    Create Piece
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Piece & SKU</TableHead>
                    <TableHead className="text-xs">Kind</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Price</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-3">
                          {p.primaryImage?.url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.primaryImage.url} alt={p.name} className="h-10 w-10 rounded-xl object-cover border" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              ✦
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground text-sm leading-snug">{p.name}</p>
                            <span className="text-[11px] text-muted-foreground font-mono">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono uppercase text-muted-foreground">
                        {p.jewelleryKind.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {p.category?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs font-serif font-semibold text-primary">
                        {p.priceCents != null ? formatPrice(p.priceCents, p.currency ?? 'INR') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.status === ProductStatus.PUBLISHED
                              ? 'border-emerald-500/40 text-emerald-500 text-[10px]'
                              : 'border-amber-500/40 text-amber-500 text-[10px]'
                          }
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 rounded-full text-xs"
                            title="Launch AR Try-On"
                          >
                            <a href={`http://localhost:3000/try-on/${p.id}`} target="_blank" rel="noreferrer">
                              <Eye className="h-3.5 w-3.5 text-primary mr-1" /> AR View
                            </a>
                          </Button>

                          {p.status === ProductStatus.DRAFT && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-full text-xs"
                              onClick={() => publishMutation.mutate(p.id)}
                              disabled={publishMutation.isPending}
                            >
                              Publish
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Product Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-xl rounded-3xl p-6 border border-primary/20 bg-card">
            <DialogHeader>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Atelier Catalogue Entry</span>
              </div>
              <DialogTitle className="font-serif text-2xl font-light">Add New Piece</DialogTitle>
              <CardDescription className="text-xs">
                Enter details to register this jewellery item in the virtual showroom.
              </CardDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pieceName" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Piece Name *
                  </Label>
                  <Input
                    id="pieceName"
                    placeholder="e.g. Royal Emerald Pendant"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pieceSku" className="text-xs uppercase tracking-wider text-muted-foreground">
                    SKU Code *
                  </Label>
                  <Input
                    id="pieceSku"
                    placeholder="e.g. LUM-EAR-001"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Jewellery Kind *
                  </Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as JewelleryKind)}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(JewelleryKind).map((k) => (
                        <SelectItem key={k} value={k}>
                          {k.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Collection / Category *
                  </Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesQuery.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="piecePrice" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Price in Cents (e.g. 8450000 = ₹84,500)
                  </Label>
                  <Input
                    id="piecePrice"
                    type="number"
                    value={priceCents}
                    onChange={(e) => setPriceCents(e.target.value)}
                    className="rounded-xl font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pieceCurrency" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Currency
                  </Label>
                  <Input
                    id="pieceCurrency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="rounded-xl font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pieceDesc" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description & Gemstone Specs
                </Label>
                <Textarea
                  id="pieceDesc"
                  placeholder="18K Yellow Gold with brilliant-cut diamonds, handcrafted by master artisans..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs min-h-[70px]"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="rounded-full px-6">
                  {createMutation.isPending ? 'Publishing…' : 'Save & Publish Piece'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId && (
          <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent className="max-w-md rounded-3xl p-6 border border-destructive/20 bg-card">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Confirm Deletion</DialogTitle>
                <CardDescription className="text-xs">
                  Are you sure you want to remove this piece from the showroom? This will disable AR fitting for this item.
                </CardDescription>
              </DialogHeader>
              <DialogFooter className="pt-4">
                <Button variant="ghost" onClick={() => setDeleteConfirmId(null)} className="rounded-full">
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(deleteConfirmId)}
                  disabled={deleteMutation.isPending}
                  className="rounded-full"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete Piece'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminShell>
  );
}
