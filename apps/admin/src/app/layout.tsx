import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import '@vj/ui/globals.css';
import { AppProviders } from '@/providers/app-providers';

export const metadata: Metadata = {
  title: {
    default: 'Lumière Console — Atelier Administration',
    template: '%s · Lumière Console',
  },
  description: 'Enterprise virtual try-on, catalogue management, and 3D asset calibration console.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
