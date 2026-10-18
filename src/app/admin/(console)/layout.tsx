import { AdminShell } from '@/components/admin/admin-shell';
import { RequireAdmin } from '@/features/auth/guards';

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
