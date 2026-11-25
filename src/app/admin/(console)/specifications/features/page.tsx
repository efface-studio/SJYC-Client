import { AdminPage } from '@/components/admin/admin-page';
import { FeatureReference } from '@/features/specifications/feature-reference';
export default function Page() {
  return (
    <AdminPage view="reference" title="기능 명세서" permission="admin.access">
      <FeatureReference />
    </AdminPage>
  );
}
