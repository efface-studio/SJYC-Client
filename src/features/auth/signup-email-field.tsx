import { ArrowUpLeft } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import { TextField } from '@/components/ui/field';
import { suggestedEmails } from '@/domain/signup-feedback';

export function SignupEmailField({ error, onEdit }: { error?: string; onEdit: () => void }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const suggestions = open ? suggestedEmails(value) : [];
  function select(email: string) {
    setValue(email);
    setActive(-1);
    setOpen(false);
    onEdit();
  }
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing || !suggestions.length) return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive((current) => Math.min(current + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
        break;
      case 'Enter':
        if (suggestions[active]) {
          event.preventDefault();
          select(suggestions[active]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        setActive(-1);
    }
  }
  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <TextField
        label="이메일"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        required
        error={error}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
        aria-controls={suggestions.length ? listId : undefined}
        aria-activedescendant={suggestions[active] ? listId + '-' + active : undefined}
        value={value}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onChange={(event) => {
          setValue(event.target.value);
          setActive(-1);
          setOpen(true);
          onEdit();
        }}
      />
      {suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="이메일 주소 제안"
          className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border border-line bg-surface"
        >
          {suggestions.map((email, index) => (
            <li key={email} role="presentation" className="border-b border-line last:border-0">
              <button
                type="button"
                role="option"
                id={listId + '-' + index}
                tabIndex={-1}
                aria-selected={index === active}
                aria-label={email}
                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-sm text-ink-700 hover:bg-surface-muted aria-selected:bg-surface-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(email)}
              >
                <span className="min-w-0 truncate">{email}</span>
                <ArrowUpLeft aria-hidden size={14} className="shrink-0 text-ink-600" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
