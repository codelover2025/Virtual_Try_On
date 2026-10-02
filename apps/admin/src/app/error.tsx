'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@vj/ui';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Console Admin Error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <span className="text-xs uppercase tracking-widest text-destructive font-mono font-semibold">
          Console Exception
        </span>
        <h1 className="font-serif text-3xl font-light text-foreground mt-1">Administrative Error</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          {error.message || 'An error occurred while fetching console telemetry or catalogue data.'}
        </p>
      </div>
      <Button onClick={() => reset()} className="rounded-full">
        <RefreshCw className="mr-2 h-4 w-4" /> Retry Action
      </Button>
    </div>
  );
}
