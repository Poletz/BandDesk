import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components';
import { getServerSession } from '@/utils/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { session, user } = await getServerSession();

  if (!session || !user) {
    redirect('/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
