import { TextField } from '@/components/ui/field';

export function SignupEmailField({ error, onEdit }: { error?: string; onEdit: () => void }) {
  return (
    <TextField
      label="이메일"
      name="email"
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      required
      error={error}
      placeholder="name@example.com"
      onChange={onEdit}
    />
  );
}
