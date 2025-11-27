// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';

export const metadata: Metadata = {
  title: 'Dependable Call Exchange',
  description: 'Admin console for the DCX call exchange backend.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-950 text-slate-50 antialiased">
        <div className="min-h-screen flex">
          {/* Sidebar (desktop) */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col">
            {/* Top bar (optional, could add user info later) */}
            <header className="h-12 border-b border-slate-800 bg-slate-950/90 backdrop-blur flex items-center px-4 md:px-6">
              <div className="text-xs text-slate-500">
                Dependable Call Exchange ·{' '}
                <span className="text-slate-300">Admin</span>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}