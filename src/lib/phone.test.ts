import { describe, expect, it } from 'vitest';
import { editMobilePhone, formatMobilePhone } from './phone';

describe('휴대전화 입력', () => {
  it.each([
    ['', ''],
    ['0101', '010-1'],
    ['0101234567', '010-123-4567'],
    ['01012345678', '010-1234-5678'],
    ['+82 10 1234 5678', '010-1234-5678'],
    ['010-1234-5678', '010-1234-5678'],
    ['010123456789', '010123456789'],
  ])('%s → %s', (input, result) => expect(formatMobilePhone(input)).toBe(result));
  it('하이픈만 지워질 때 앞자리도 지운다', () => {
    expect(editMobilePhone('010-1234-5678', '010-12345678')).toBe('010-123-5678');
  });
});
