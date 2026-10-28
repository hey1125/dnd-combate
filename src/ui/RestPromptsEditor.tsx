import { newId } from '../core/factory'
import type { EffectRule, RestPrompt, RestPromptOption } from '../core/types'
import { Field, Select } from './fields'
import { advantageLabel } from './labels'

const afterOptions: { value: RestPrompt['after']; label: string }[] = [
  { value: 'both', label: 'Cualquier descanso' },
  { value: 'short', label: 'Solo descanso corto' },
  { value: 'long', label: 'Solo descanso largo' },
]

type RuleKind = EffectRule['kind'] | ''
const ruleOptions: { value: RuleKind; label: string }[] = [
  { value: '', label: 'Sin regla' },
  ...(Object.keys(advantageLabel) as (keyof typeof advantageLabel)[]).map((value) => ({ value, label: advantageLabel[value] })),
  { value: 'against', label: 'Contra ti' },
  { value: 'note', label: 'Nota' },
]

type Props = { prompts: RestPrompt[]; onChange: (prompts: RestPrompt[]) => void }

/** Editor de recordatorios de descanso. Cada respuesta puede añadir un estado con una regla. */
export function RestPromptsEditor({ prompts, onChange }: Props) {
  const patch = (id: string, p: Partial<RestPrompt>) => onChange(prompts.map((x) => (x.id === id ? { ...x, ...p } : x)))
  const patchOption = (prompt: RestPrompt, index: number, o: RestPromptOption) =>
    patch(prompt.id, { options: prompt.options.map((x, i) => (i === index ? o : x)) })

  return (
    <section className="card">
      <h2>Recordatorios al descansar</h2>
      {prompts.length === 0 && (
        <p className="muted">Preguntas que aparecen al terminar un descanso, como una tirada diaria que cambia tus reglas.</p>
      )}
      <div className="edit-list">
        {prompts.map((p) => (
          <div key={p.id} className="edit-item">
            <div className="form-grid">
              <Field label="Pregunta" className="span-2">
                <input
                  value={p.question}
                  placeholder="Ej. ¿Qué sacaste en el trastorno (1d4)?"
                  onChange={(e) => patch(p.id, { question: e.target.value })}
                />
              </Field>
              <Field label="Cuándo" className="span-2">
                <Select value={p.after} options={afterOptions} onChange={(after) => patch(p.id, { after })} />
              </Field>
            </div>

            <div className="prompt-options">
              {p.options.map((o, i) => {
                const rule = o.effect?.rules?.[0]
                const setEffect = (name: string, kind: RuleKind, text: string) => {
                  if (!name.trim()) return patchOption(p, i, { label: o.label })
                  // Solo se edita la primera regla; si el JSON trae más, se conservan.
                  const rest = o.effect?.rules?.slice(1) ?? []
                  const rules = kind ? [{ kind, text }, ...rest] : rest
                  patchOption(p, i, { label: o.label, effect: { name, rules: rules.length ? rules : undefined } })
                }
                return (
                  <div key={i} className="prompt-option">
                    <Field label={`Respuesta ${i + 1}`}>
                      <input value={o.label} placeholder="Ej. 1 · Voces" onChange={(e) => patchOption(p, i, { ...o, label: e.target.value })} />
                    </Field>
                    <Field label="Añade el estado">
                      <input
                        value={o.effect?.name ?? ''}
                        placeholder="Ninguno"
                        onChange={(e) => setEffect(e.target.value, rule?.kind ?? '', rule?.text ?? '')}
                      />
                    </Field>
                    {o.effect && (
                      <>
                        <Field label="Regla">
                          <Select
                            value={(rule?.kind ?? '') as RuleKind}
                            options={ruleOptions}
                            onChange={(kind) => setEffect(o.effect!.name, kind, rule?.text ?? '')}
                          />
                        </Field>
                        {rule && (
                          <Field label="A qué se aplica">
                            <input
                              value={rule.text}
                              placeholder="Ej. salvaciones de SAB"
                              onChange={(e) => setEffect(o.effect!.name, rule.kind, e.target.value)}
                            />
                          </Field>
                        )}
                      </>
                    )}
                    <button
                      className="btn btn--icon btn--ghost-danger prompt-option__remove"
                      aria-label={`Quitar respuesta ${i + 1}`}
                      disabled={p.options.length === 1}
                      onClick={() => patch(p.id, { options: p.options.filter((_, j) => j !== i) })}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="row">
              <button className="btn btn--small" onClick={() => patch(p.id, { options: [...p.options, { label: '' }] })}>
                + Respuesta
              </button>
              <button
                className="btn btn--small btn--ghost-danger"
                onClick={() => onChange(prompts.filter((x) => x.id !== p.id))}
              >
                Quitar recordatorio
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="hint">Al responder de nuevo, el estado de la respuesta anterior se reemplaza. El descanso largo quita todos los estados.</p>
      <div className="row">
        <button
          className="btn"
          onClick={() => onChange([...prompts, { id: newId(), question: '', after: 'both', options: [{ label: '' }] }])}
        >
          + Recordatorio
        </button>
      </div>
    </section>
  )
}
