import type { ReactNode } from 'react'

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className="field__label">{label}</span>
      {children}
    </label>
  )
}

/** Input numérico: vacío se guarda como NaN para que la validación lo marque. */
export function NumberInput({ value, onChange, min }: { value: number; onChange: (n: number) => void; min?: number }) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      value={Number.isNaN(value) ? '' : value}
      onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
    />
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
