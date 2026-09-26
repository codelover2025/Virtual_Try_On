import type { ReactNode } from 'react';

/**
 * Minimal root layout only - UI pages intentionally omitted in foundation phase.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
