'use client';

import { PanelLeft, PanelTop } from 'lucide-react';
import { useCallback, useState, useSyncExternalStore } from 'react';

type Layout = 'top' | 'side';
const changed = 'sjyc:admin-navigation';
function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener(changed, notify);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener(changed, notify);
  };
}
function defaultLayout(): Layout {
  return 'top';
}

export function useNavPreference(userId: string | undefined) {
  const key = 'sjyc.admin.navigation.' + (userId ?? '');
  const [temporary, setTemporary] = useState<{ key: string; layout: Layout }>();
  const snapshot = useCallback((): Layout => {
    try {
      return localStorage.getItem(key) === 'side' ? 'side' : 'top';
    } catch {
      return 'top';
    }
  }, [key]);
  const saved = useSyncExternalStore(subscribe, snapshot, defaultLayout);
  const layout = temporary?.key === key ? temporary.layout : saved;
  function setLayout(value: Layout) {
    if (!userId) return;
    try {
      localStorage.setItem(key, value);
      setTemporary(undefined);
      window.dispatchEvent(new Event(changed));
    } catch {
      setTemporary({ key, layout: value });
    }
  }
  return { layout, setLayout };
}

export function NavPreference({ layout, setLayout }: { layout: Layout; setLayout: (value: Layout) => void }) {
  return (
    <div className="nav-preference" role="group" aria-label="메뉴 배치">
      {(
        [
          { value: 'top', name: '상단', Icon: PanelTop },
          { value: 'side', name: '사이드', Icon: PanelLeft },
        ] as const
      ).map(({ value, name, Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={name + ' 메뉴'}
          aria-pressed={layout === value}
          onClick={() => setLayout(value)}
        >
          <Icon size={15} aria-hidden />
          <span>{name}</span>
        </button>
      ))}
    </div>
  );
}
