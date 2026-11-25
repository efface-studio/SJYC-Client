import { birthDateError, confirmFeedback, passwordRules, emailWithDomain } from './signup-feedback';
import { signupSchema } from './schemas';

describe('회원가입 입력', () => {
  it('만 14세 미만과 윤년 생일을 허용하고 빈 값, 미래, 잘못된 날짜를 구분한다', () => {
    const today = '2026-11-24';
    for (const date of ['2020-02-29', '2013-11-24', today])
      expect(birthDateError(date, today)).toBeUndefined();
    for (const date of ['', '2020-02-30', '2026-11-25', '1919-12-31'])
      expect(birthDateError(date, today)).toBeTruthy();
  });
  it('화면에 표시되는 모든 비밀번호 조건과 가입 스키마의 결과가 일치한다', () => {
    for (const password of [
      '',
      '12345678',
      'abcdefgh',
      'abcdefg1',
      '가나다라마바사1',
      'a'.repeat(64) + '1',
    ]) {
      const input = {
        name: '검증',
        email: 'qa@example.org',
        password,
        passwordConfirm: password,
        birthYear: 2020,
        agreeTerms: 'on',
        agreePrivacy: 'on',
      };
      expect(passwordRules.every((rule) => rule.test(password))).toBe(signupSchema.safeParse(input).success);
    }
    expect(confirmFeedback('abcdefg1', 'abc')).toBeUndefined();
    expect(confirmFeedback('abcdefg1', 'abcdefg2')).toContain('일치하지');
    expect(confirmFeedback('abcdefg1', 'abcdefg1')).toBe('일치합니다.');
  });
  it('선택한 도메인만 교체하고 직접 입력한 주소와 아이디는 보존한다', () => {
    expect(emailWithDomain('student+1', 'gmail.com')).toBe('student+1@gmail.com');
    expect(emailWithDomain('student@nav', 'naver.com')).toBe('student@naver.com');
    expect(emailWithDomain('student@school.kr', '')).toBe('student@school.kr');
    expect(emailWithDomain('', 'naver.com')).toBe('');
  });
});
