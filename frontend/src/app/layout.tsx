// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/top-bar';
import { NoticeBanner } from '@/components/ui/notice';

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
        <div className="flex min-h-screen">
          {/* Sidebar (desktop) */}
          <Sidebar />

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            <TopBar />

            {/* Manually added notice rail to surface Trackdrive-style alerts */}
            <section className="border-b border-slate-900 bg-slate-950/70 px-4 py-3 md:px-6">
              <NoticeBanner
                title="Signed in successfully."
                description="All services operational · Next refresh at the top of the hour."
                action={<span className="text-[10px] uppercase text-slate-200">Live</span>}
              />
            </section>

            <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}