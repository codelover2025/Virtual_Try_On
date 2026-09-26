import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Virtual Jewellery Try-On',
  description: 'Phase 1 foundation - camera try-on',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          background: '#0f1419',
          color: '#f5f0e8',
        }}
      >
        {children}
      </body>
    </html>
  );
}
