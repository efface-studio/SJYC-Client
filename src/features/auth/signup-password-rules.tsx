import { passwordRules } from '@/domain/signup-feedback';
import './signup-password-rules.css';

export function SignupPasswordRules({ password }: { password: string }) {
  const passed = passwordRules.map((rule) => rule.test(password));
  const count = passed.filter(Boolean).length;
  return (
    <div className="signup-rules" id="signup-password-rules">
      <div className="flex items-center gap-3">
        <div aria-hidden="true" className="flex flex-1 gap-1">
          {passwordRules.map(({ label }, i) => (
            <span className="signup-meter-segment" key={label}>
              <i data-active={i < count} style={{ transitionDelay: i < count ? i * 50 + 'ms' : '0ms' }} />
            </span>
          ))}
        </div>
        <span role="status" aria-atomic="true" className="text-xs text-ink-600 tabular-nums">
          <span className="sr-only">충족한 비밀번호 조건 </span>
          {count} / {passed.length}
        </span>
      </div>
      <ul aria-label="비밀번호 조건" className="flex flex-wrap gap-x-4 gap-y-1.5">
        {passwordRules.map(({ label }, i) => (
          <li key={label} data-met={passed[i]}>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="7" />
              <path d="M4 8.25 6.75 11 12 5" pathLength="1" />
            </svg>
            <span className="signup-rule-label">{label}</span>
            <span className="sr-only">{passed[i] ? ' 충족' : ' 미충족'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
