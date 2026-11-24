import { AdminPage } from '@/components/admin/admin-page';
import { ApiReference } from '@/features/specifications/api-reference';
export default function Page() {
  return (
    <AdminPage title="API 명세서" permission="admin.access">
      <ApiReference />
    </AdminPage>
  );
}
