'use client';

import { queryKeys } from '@vj/api-client';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, PageLoader, ProductCard, Skeleton } from '@vj/ui';
import Link from 'next/link';
import { Button } from '@vj/ui';
import { api } from '@/lib/api';
import { ProductFilters } from '@/components/catalog/product-filters';
import { useCatalogFiltersStore } from '@/stores/catalog-filters-store';

export default function ProductsPage() {
  const { q, categoryId, jewelleryKind } = useCatalogFiltersStore();

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all(true),
    queryFn: () => api.catalog.listCategories({ flat: true, isActive: true }),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.products.list({ q, categoryId, jewelleryKind, page: 1, pageSize: 24 }),
    queryFn: () => api.catalog.listProducts({ q, categoryId, jewelleryKind, page: 1, pageSize: 24 }),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        {categoriesQuery.data ? (
          <ProductFilters categories={categoriesQuery.data} />
        ) : (
          <Skeleton className="h-64 w-full" />
        )}
      </aside>
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold">Catalogue</h1>
            <p className="mt-1 text-sm text-muted-foreground">Discover pieces ready for virtual try-on.</p>
          </div>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
            ))}
          </div>
        ) : productsQuery.isError ? (
          <EmptyState
            title="Could not load products"
            description="Please check your connection and try again."
            action={
              <Button onClick={() => productsQuery.refetch()} variant="secondary">
                Retry
              </Button>
            }
          />
        ) : productsQuery.data?.items.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6">
            {productsQuery.data.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No pieces match"
            description="Try clearing filters or browse all categories."
            action={
              <Button asChild>
                <Link href="/products">View all</Link>
              </Button>
            }
          />
        )}
      </section>
    </div>
  );
}
