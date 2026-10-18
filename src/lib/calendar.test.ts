import type { Program } from '@/domain/types';
import { isMonth, monthGrid, programsOn, shiftMonth } from './calendar';

describe('달력 날짜 도우미', () => {
  it('월 이동은 연도를 넘긴다', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-10', 0)).toBe('2026-10');
  });

  it('월 형식만 허용한다', () => {
    expect(isMonth('2026-10')).toBe(true);
    expect(isMonth('2026-13')).toBe(false);
    expect(isMonth('2026-1')).toBe(false);
    expect(isMonth(null)).toBe(false);
  });

  it('일요일 시작 주 단위 격자를 만든다', () => {
    // 2026-10-01 은 목요일
    const weeks = monthGrid('2026-10');
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]![0]).toBe('2026-09-27');
    expect(weeks[0]![4]).toBe('2026-10-01');
    expect(weeks.at(-1)!.at(-1)).toBe('2026-10-31');
    // 2026-02 는 일요일 시작 28일 → 정확히 4주
    expect(monthGrid('2026-02')).toHaveLength(4);
  });

  it('서울 기준 날짜로 운영 기간·모집 마감을 찾는다', () => {
    const p = {
      id: 'p-1',
      // 서울 10-05 00:30 = UTC 10-04 15:30 — UTC 날짜로 비교하면 하루 어긋난다
      startsAt: '2026-10-04T15:30:00Z',
      endsAt: '2026-10-10T09:00:00Z',
      recruitEndsAt: '2026-10-02T09:00:00Z',
    } as Program;
    expect(programsOn('2026-10-04', [p]).running).toHaveLength(0);
    expect(programsOn('2026-10-05', [p]).running).toHaveLength(1);
    expect(programsOn('2026-10-10', [p]).running).toHaveLength(1);
    expect(programsOn('2026-10-02', [p]).deadline).toHaveLength(1);
    expect(programsOn('2026-10-03', [p])).toEqual({ deadline: [], running: [] });
  });
});
