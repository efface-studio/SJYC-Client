import type { Scenario } from '@/api/mock/store';

export const SCENARIOS: { value: Scenario; label: string; hint: string }[] = [
  { value: 'normal', label: '정상', hint: '데모 데이터로 동작' },
  { value: 'slow', label: '느린 응답', hint: '로딩 상태 확인 (1.5초 지연)' },
  { value: 'empty', label: '빈 데이터', hint: '목록이 비어 있는 상태 확인' },
  { value: 'error', label: '서버 오류', hint: '모든 요청이 실패하는 상태 확인' },
];
