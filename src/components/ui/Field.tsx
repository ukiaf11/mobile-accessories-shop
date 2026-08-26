import {
  forwardRef, useId,
  type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react';
import { cn } from '../../lib/cn';

/**
 * Form field primitives.
 *
 * Every control gets a real `<label for>`, and errors are wired through
 * `aria-describedby` + `aria-invalid` so screen readers announce them
 * (blueprint 01 NFR accessibility).
 */

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  optionalLabel?: string;
  className?: string;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

export function FieldShell({
  label, hint, error, required, optionalLabel = 'Optional', className, children,
}: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-3 text-sm font-medium text-ink">
        <span>
          {label}
          {required && <span className="ml-1 text-danger" aria-hidden>*</span>}
        </span>
        {!required && <span className="text-xs font-normal text-subtle">{optionalLabel}</span>}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted">{hint}</p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">{error}</p>
      )}
    </div>
  );
}

const CONTROL =
  'w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle ' +
  'transition-colors duration-150 outline-none ' +
  'focus:border-accent focus:ring-4 focus:ring-accent-ring/40 ' +
  'disabled:bg-surface-soft disabled:text-muted';

const OK = 'border-line-strong hover:border-subtle';
const BAD = 'border-danger bg-danger-soft/30';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string; hint?: string; error?: string; containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, hint, error, required, containerClassName, className, ...rest }, ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <input
          {...rest}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, invalid ? BAD : OK, className)}
        />
      )}
    </FieldShell>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string; hint?: string; error?: string; containerClassName?: string;
};

export const TextArea = forwardRef<HTMLTextAreaElement, AreaProps>(function TextArea(
  { label, hint, error, required, containerClassName, className, ...rest }, ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <textarea
          {...rest}
          ref={ref}
          id={id}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'min-h-24 resize-y', invalid ? BAD : OK, className)}
        />
      )}
    </FieldShell>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string; hint?: string; error?: string; containerClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField(
  { label, hint, error, required, containerClassName, className, children, ...rest }, ref,
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required} className={containerClassName}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            {...rest}
            ref={ref}
            id={id}
            required={required}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(CONTROL, 'appearance-none pr-10', invalid ? BAD : OK, className)}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted"
            viewBox="0 0 20 20" fill="none" aria-hidden
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </FieldShell>
  );
});

/** Hidden anti-spam input. Never shown, never announced, never autofilled. */
export function Honeypot({ register }: { register?: Record<string, unknown> }) {
  return (
    <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
      <label htmlFor="mas-company">Company (leave blank)</label>
      <input
        id="mas-company"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        {...register}
      />
    </div>
  );
}
