'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderTree, Sparkles, Trash2, Edit, CheckCircle } from 'lucide-react';
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
  Textarea,
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
  toast,
} from '@vj/ui';
import { api } from '@/lib/api';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  // Load categories
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'full'],
    queryFn: () => api.catalog.listCategories({ flat: true }),
  });

  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api.admin.createCategory({
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: description.trim() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
        isActive: true,
      }),
    onSuccess: () => {
      toast.success('Collection category created');
      setCreateOpen(false);
      setName('');
      setSlug('');
      setDescription('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not create category');
    },
  });

  // Delete Category Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.admin.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category removed');
      setDeleteConfirmId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
    onError: () => toast.error('Could not delete category'),
  });

  const categories = categoriesQuery.data ?? [];

  return (
    <AdminShell title="Category & Collection Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-foreground">Collection Taxonomy</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Organize jewellery categories, hierarchies, and navigation links for customer discovery.
            </p>
          </div>

          <Button onClick={() => setCreateOpen(true)} className="rounded-full gap-2 shadow-sm self-start sm:self-auto">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </div>

        {/* Categories Table */}
        <Card className="rounded-3xl border overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {categoriesQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <EmptyState
                title="No categories registered"
                description="Create your first fine jewellery category (e.g. Earrings, Necklaces, Solitaires)."
                action={
                  <Button onClick={() => setCreateOpen(true)} className="rounded-full">
                    Create Category
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category Name</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs">Sort Order</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FolderTree className="h-4 w-4" />
                          </div>
                          <span className="font-semibold text-foreground text-sm">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{c.slug}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {c.description || '—'}
                      </TableCell>
                      <TableCell className="text-xs font-mono">{c.sortOrder}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={c.isActive ? 'border-emerald-500/40 text-emerald-500 text-[10px]' : 'text-muted-foreground text-[10px]'}
                        >
                          {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Category Modal */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md rounded-3xl p-6 border border-primary/20 bg-card">
            <DialogHeader>
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-primary font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Taxonomy Entry</span>
              </div>
              <DialogTitle className="font-serif text-2xl font-light">Create Collection Category</DialogTitle>
              <CardDescription className="text-xs">
                Define a new collection grouping for your showroom catalogue.
              </CardDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="catName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Category Name *
                </Label>
                <Input
                  id="catName"
                  placeholder="e.g. Chandelier Earrings"
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
                <Label htmlFor="catSlug" className="text-xs uppercase tracking-wider text-muted-foreground">
                  URL Slug *
                </Label>
                <Input
                  id="catSlug"
                  placeholder="e.g. chandelier-earrings"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catDesc" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="catDesc"
                  placeholder="Editorial description of this fine collection..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="rounded-xl text-xs min-h-[70px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="catSort" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Display Order Priority
                </Label>
                <Input
                  id="catSort"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl font-mono text-xs"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} className="rounded-full">
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="rounded-full px-6">
                  {createMutation.isPending ? 'Saving…' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <Dialog open={Boolean(deleteConfirmId)} onOpenChange={() => setDeleteConfirmId(null)}>
            <DialogContent className="max-w-md rounded-3xl p-6 border border-destructive/20 bg-card">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">Delete Category?</DialogTitle>
                <CardDescription className="text-xs">
                  This will remove this category classification from the platform. Existing pieces will need to be
                  reassigned.
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
                  {deleteMutation.isPending ? 'Deleting…' : 'Confirm Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminShell>
  );
}
