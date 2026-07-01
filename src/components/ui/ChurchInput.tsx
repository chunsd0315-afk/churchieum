import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

const INPUT_BASE = [
  'w-full bg-white border border-gray-200 rounded-[14px] px-3.5',
  'text-sm text-gray-900 placeholder:text-gray-400',
  'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
  'transition-colors duration-150',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

// ─── ChurchInput ──────────────────────────────────────────────────────────────

export type ChurchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function ChurchInput({ label, error, className = '', id, ...rest }: ChurchInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-gray-600">
          {label}
        </label>
      )}
      <input
        id={id}
        {...rest}
        className={`${INPUT_BASE} h-12 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── ChurchTextarea ───────────────────────────────────────────────────────────

export type ChurchTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function ChurchTextarea({ label, error, className = '', id, ...rest }: ChurchTextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-gray-600">
          {label}
        </label>
      )}
      <textarea
        id={id}
        {...rest}
        className={[
          INPUT_BASE,
          'min-h-[120px] py-3.5 resize-y',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '',
          className,
        ].join(' ')}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── ChurchSelect ─────────────────────────────────────────────────────────────

export type ChurchSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  children: ReactNode;
};

export function ChurchSelect({ label, error, children, className = '', id, ...rest }: ChurchSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-gray-600">
          {label}
        </label>
      )}
      <select
        id={id}
        {...rest}
        className={[
          INPUT_BASE,
          'h-12 appearance-none cursor-pointer',
          'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%236B7280\' stroke-width=\'1.5\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E")]',
          'bg-no-repeat bg-[right_14px_center] pr-10',
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : '',
          className,
        ].join(' ')}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
