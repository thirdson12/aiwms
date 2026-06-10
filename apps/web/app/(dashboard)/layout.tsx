import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar user={user} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 pt-16 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
