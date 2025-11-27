// frontend/src/app/suppliers/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';
import { SuppliersTable } from '@/components/suppliers/table';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type Supplier = components['schemas']['Supplier'];
type PaginatedSuppliers = {
  data: Supplier[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

async function getSuppliers(): Promise<Supplier[]> {
  const { data, error } = await apiClient.GET('/api/suppliers', {
    params: {
      query: {
        page: 1,
        limit: 20
      }
    }
  });

  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }

  // data is the envelope: { data: Supplier[]; meta: { ... } }
  const envelope = data as PaginatedSuppliers;
  return (envelope?.data ?? []) as Supplier[];
}

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Suppliers
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Registered suppliers in the DCX backend.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <SuppliersTable suppliers={suppliers} />
        </section>
      </div>
    </main>
  );
}
