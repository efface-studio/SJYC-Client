import { ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';
import { TextField } from '@/components/ui/field';
import { emailDomains, emailWithDomain } from '@/domain/signup-feedback';

export function SignupEmailField({ error, onEdit }: { error?: string; onEdit: () => void }) {
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const canChoose = !!value.split('@')[0]?.trim();
  return (
    <TextField
      ref={input}
      label="이메일"
      name="email"
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      required
      error={error}
      placeholder="example@email.com"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        onEdit();
      }}
      trailing={
        <label className="relative flex min-h-11 shrink-0 items-center gap-1 px-2 text-xs font-semibold text-ink-600 focus-within:outline-2 focus-within:outline-brand-700 has-disabled:opacity-50">
          <span aria-hidden="true">도메인 선택</span>
          <ChevronDown size={13} aria-hidden="true" />
          <select
            aria-label="이메일 도메인 선택"
            disabled={!canChoose}
            value=""
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
            onChange={(e) => {
              setValue(emailWithDomain(value, e.target.value));
              onEdit();
              input.current?.focus();
            }}
          >
            <option value="" disabled>
              도메인 선택
            </option>
            {emailDomains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
            <option value="custom">직접 입력</option>
          </select>
        </label>
      }
    />
  );
}
