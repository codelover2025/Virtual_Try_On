import Link from 'next/link';
import { TryOnStage } from '@/features/try-on/TryOnStage';

export default function TryOnPage() {
  return (
    <main style={{ padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.65 }}>
            Phase 1 · AR Engine
          </p>
          <h1 style={{ margin: '6px 0 0', fontSize: '1.75rem' }}>Live jewellery try-on</h1>
        </div>
        <Link href="/" style={{ color: '#d4af37', alignSelf: 'center' }}>
          Home
        </Link>
      </div>
      <TryOnStage />
    </main>
  );
}
