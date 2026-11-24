import { Skeleton } from '@/components/ui/states';

export function DirectorySkeleton({ kind }: { kind: 'clubs' | 'spaces' }) {
  const clubs = kind === 'clubs';
  return (
    <div role="status" aria-label={clubs ? '동아리 불러오는 중' : '공간 불러오는 중'}>
      <div aria-hidden="true" className={clubs ? '' : 'space-floor'}>
        <div className={clubs ? 'club-list-tools' : 'mb-3'}>
          <Skeleton className={clubs ? 'my-2 h-7 w-32' : 'h-9 w-12'} />
        </div>
        <ul className={clubs ? 'clubs-index' : undefined}>
          {Array.from({ length: clubs ? 4 : 3 }, (_, i) => (
            <li key={i}>
              <div className={clubs ? 'club-list-link' : 'space-row'}>
                <Skeleton className={clubs ? 'club-visual' : 'space-thumbnail'} />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-5/6" />
                  {clubs && <Skeleton className="h-4 w-16" />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
