import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
      <p style={{ letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.7, fontSize: 12 }}>
        Phase 1 Foundation
      </p>
      <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)', margin: '8px 0 16px' }}>
        Virtual Jewellery Try-On
      </h1>
      <p style={{ lineHeight: 1.6, opacity: 0.85, maxWidth: 540 }}>
        Production foundation is live: NestJS APIs, PostgreSQL, JWT/RBAC, and the browser AR
        engine (camera, BlazeFace detection, Three.js overlay).
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
        <Link
          href="/try-on"
          style={{
            background: '#d4af37',
            color: '#1a1408',
            padding: '12px 20px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Open Try-On Demo
        </Link>
        <a
          href="http://localhost:4000/api/docs"
          style={{
            border: '1px solid #d4af37',
            color: '#d4af37',
            padding: '12px 20px',
            textDecoration: 'none',
          }}
        >
          API Docs
        </a>
      </div>
    </main>
  );
}
