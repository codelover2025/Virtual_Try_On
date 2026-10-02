import Link from 'next/link';
import { Button } from '@vj/ui';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div>
        <span className="text-xs uppercase tracking-widest text-primary font-mono font-semibold">
          Admin 404
        </span>
        <h1 className="font-serif text-3xl font-light text-foreground mt-1">Console Route Not Found</h1>
        <p className="text-xs text-muted-foreground mt-2 max-w-sm">
          The administration view or telemetry screen you requested is not available.
        </p>
      </div>
      <Button asChild className="rounded-full">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Return to Dashboard Overview
        </Link>
      </Button>
    </div>
  );
}
