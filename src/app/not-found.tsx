import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main
      id="main"
      className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-16 text-center"
    >
      <p className="text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-[15px] text-ink-600">주소가 바뀌었거나 삭제된 페이지입니다.</p>
      <Link href="/" className={`${buttonClass({ size: 'lg' })} mt-6`}>
        홈으로 이동
      </Link>
    </main>
  );
}
