'use client';

import { useQueryClient } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { mockDev } from '@/api/mock/client';
import { REFERENCE_COLLECTED_AT } from '@/api/mock/research';
import { DEMO_ACCOUNTS } from '@/api/mock/seed';
import type { Scenario } from '@/api/mock/store';
import { DEMO_DATA, IS_MOCK } from '@/config/env';
import { Button } from './ui/button';
import { Radio } from './ui/choice';
import { Modal } from './ui/dialog';

export const SCENARIOS: { value: Scenario; label: string; hint: string }[] = [
  { value: 'normal', label: '정상', hint: '데모 데이터로 동작' },
  { value: 'slow', label: '느린 응답', hint: '로딩 상태 확인 (1.5초 지연)' },
  { value: 'empty', label: '빈 데이터', hint: '목록이 비어 있는 상태 확인' },
  { value: 'error', label: '서버 오류', hint: '모든 요청이 실패하는 상태 확인' },
];

const noopSubscribe = () => () => undefined;

/**
 * 데모 표시 띠 + 개발 도구(mock 모드만). 시연 서버(http + DEMO_DATA)는 띠만, 실제 운영 서버에서는 렌더링되지 않는다.
 * "데모 데이터"임을 항상 화면에 노출해 실제 서비스로 오인하지 않게 한다.
 */
export function DemoBanner({ tone = 'site' }: { tone?: 'site' | 'admin' }) {
  const [open, setOpen] = useState(false);
  // 서버 렌더링 값은 항상 'normal', 브라우저에서 sessionStorage 값을 읽는다 (하이드레이션 불일치 방지)
  const stored = useSyncExternalStore(
    noopSubscribe,
    () => (IS_MOCK ? mockDev.readScenario() : 'normal'),
    () => 'normal' as Scenario,
  );
  const [override, setScenario] = useState<Scenario | null>(null);
  const scenario = override ?? stored;
  const qc = useQueryClient();

  if (!IS_MOCK) {
    if (!DEMO_DATA) return null;
    return (
      <div
        className={
          tone === 'admin'
            ? 'bg-ink-900 text-[13px] text-white'
            : 'border-b border-warning-800/20 bg-warning-50 text-[13px] text-warning-800'
        }
      >
        <p className="container-page py-2 font-semibold">
          시연 서버 · 프로그램·공지·신청·회원은 샘플, 동아리 소개·갤러리는 공식 채널 참고 정보(
          {REFERENCE_COLLECTED_AT} 수집)
        </p>
      </div>
    );
  }

  const apply = (s: Scenario) => {
    mockDev.setScenario(s);
    setScenario(s);
    void qc.invalidateQueries();
  };

  return (
    <>
      <div
        className={
          tone === 'admin'
            ? 'bg-ink-900 text-[13px] text-white'
            : 'border-b border-warning-800/20 bg-warning-50 text-[13px] text-warning-800'
        }
      >
        <div className="container-page flex min-h-9 items-center justify-between gap-2 py-1">
          <p className="font-semibold">
            개발용 데모 · 프로그램·공지·신청은 샘플, 동아리 소개·갤러리는 공식 채널 참고 정보(
            {REFERENCE_COLLECTED_AT} 수집)
            {scenario !== 'normal' && ` · 시나리오: ${SCENARIOS.find((s) => s.value === scenario)?.label}`}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded px-2 font-semibold underline underline-offset-2"
          >
            <FlaskConical aria-hidden className="size-4" />
            개발 도구
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="개발 도구 (mock 모드)">
        <fieldset>
          <legend className="text-[15px] font-bold">응답 시나리오</legend>
          <div className="mt-2 grid gap-1">
            {SCENARIOS.map((s) => (
              <label
                key={s.value}
                className="flex min-h-11 items-center gap-3 rounded-md px-2 hover:bg-surface-muted"
              >
                <Radio
                  name="scenario"
                  value={s.value}
                  checked={scenario === s.value}
                  onChange={() => apply(s.value)}
                />
                <span>
                  <span className="font-semibold">{s.label}</span>
                  <span className="ml-2 text-sm text-ink-600">{s.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              mockDev.expireSession();
              void qc.invalidateQueries();
              setOpen(false);
            }}
          >
            로그인 세션 만료시키기
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              mockDev.reset();
              qc.clear();
              window.location.reload();
            }}
          >
            데모 데이터 초기화
          </Button>
        </div>

        <div className="mt-5 text-sm text-ink-700">
          <p className="font-bold text-ink-900">데모 계정</p>
          <p className="mt-1">로그인 화면의 “데모 계정으로 입력” 버튼을 사용하세요.</p>
          <ul className="mt-2 list-disc pl-5">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                {a.label} — {a.email}
              </li>
            ))}
          </ul>
        </div>
      </Modal>
    </>
  );
}
