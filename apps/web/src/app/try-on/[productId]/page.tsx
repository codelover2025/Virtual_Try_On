'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@vj/api-client';
import { Button, PageLoader } from '@vj/ui';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { TryOnExperience } from '@/features/try-on/TryOnExperience';

export default function TryOnPage() {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;

  const productQuery = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => api.catalog.getProduct(productId),
    enabled: Boolean(productId),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-4 border-b px-4 py-4 sm:px-6">
        <Button asChild variant="ghost" size="sm">
          <Link href={productQuery.data ? `/products/${productQuery.data.slug}` : '/products'}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Virtual try-on</p>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {productQuery.isLoading ? (
          <PageLoader label="Loading product…" />
        ) : productQuery.data ? (
          <TryOnExperience product={productQuery.data} />
        ) : (
          <p className="text-center text-muted-foreground">Product unavailable.</p>
        )}
      </main>
    </div>
  );
}
