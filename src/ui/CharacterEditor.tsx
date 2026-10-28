import { useState } from 'react'
import { applyEdits, fullCasterSlots, newAdvantage, newCharacter, newFeature, newResource } from '../core/factory'
import { validateCharacter } from '../core/schema'
import type { ActionCost, Advantage, AdvantageKind, Character, Feature, Recharge, Resource } from '../core/types'
import { isSpellSlot } from '../core/spells'
import { Field, NumberInput, OptionalNumberInput, Select } from './fields'
import { RestPromptsEditor } from './RestPromptsEditor'
import { advantageLabel, costLabel, rechargeLabel } from './labels'

type Props = {
  /** null = personaje nuevo */
  character: Character | null
  onSave: (character: Character) => void
  onCancel: () => void
}

const costOptions = (Object.keys(costLabel) as ActionCost[]).map((value) => ({ value, label: costLabel[value] }))
const advantageOptions = (Object.keys(advantageLabel) as AdvantageKind[]).map((value) => ({ value, label: advantageLabel[value] }))
const rechargeOptions = (Object.keys(rechargeLabel) as Recharge[]).map((value) => ({ value, label: rechargeLabel[value] }))

type AmountKey = 'all' | 'half' | 'one'
const amountOptions: { value: AmountKey; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'half', label: 'La mitad' },
  { value: 'one', label: 'Solo 1' },
]
const amountKey = (r: Resource): AmountKey =>
  r.rechargeAmount === 'half' ? 'half' : r.rechargeAmount === 1 ? 'one' : 'all'

type EffectKey = 'none' | 'grantAction' | 'grantMovement'
const effectOptions: { value: EffectKey; label: string }[] = [
  { value: 'none', label: 'Sin efecto automático' },
  { value: 'grantAction', label: 'Da una acción extra' },
  { value: 'grantMovement', label: 'Movimiento extra (= velocidad)' },
]

export function CharacterEditor({ character, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Character>(() => (character ? structuredClone(character) : newCharacter()))
  const [errors, setErrors] = useState<string[]>([])

  const patch = (p: Partial<Character>) => setDraft((d) => ({ ...d, ...p }))
  const patchResource = (id: string, p: Partial<Resource>) =>
    setDraft((d) => ({ ...d, resources: d.resources.map((r) => (r.id === id ? { ...r, ...p } : r)) }))
  const patchFeature = (id: string, p: Partial<Feature>) =>
    setDraft((d) => ({ ...d, features: d.features.map((f) => (f.id === id ? { ...f, ...p } : f)) }))

  const patchAdvantage = (id: string, p: Partial<Advantage>) =>
    setDraft((d) => ({ ...d, advantages: d.advantages.map((a) => (a.id === id ? { ...a, ...p } : a)) }))

  const addSpellSlots = () =>
    setDraft((d) => ({
      ...d,
      resources: [...d.resources.filter((r) => !r.id.startsWith('slot-')), ...fullCasterSlots(d.level)],
    }))

  const addBasics = () =>
    setDraft((d) => {
      const has = (name: string) => d.features.some((f) => f.name === name)
      const extra: Feature[] = []
      if (!has('Correr')) extra.push(newFeature({ name: 'Correr', cost: 'action', effect: { kind: 'grantMovement', amount: 'speed' } }))
      if (!has('Ataque de oportunidad')) extra.push(newFeature({ name: 'Ataque de oportunidad', cost: 'reaction' }))
      return { ...d, features: [...d.features, ...extra] }
    })

  const save = () => {
    const result = validateCharacter(applyEdits(character, draft))
    if (!result.ok) {
      setErrors(result.errors)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onSave(result.character)
  }

  const resourceOptions = [
    { value: '', label: 'No gasta recurso' },
    ...draft.resources.map((r) => ({ value: r.id, label: r.name || '(sin nombre)' })),
  ]

  return (
    <main className="app">
      <header className="top">
        <h1>{character ? 'Editar personaje' : 'Nuevo personaje'}</h1>
        <button className="btn btn--small" onClick={onCancel}>
          Cancelar
        </button>
      </header>

      {errors.length > 0 && (
        <div className="notice notice--error" role="alert">
          <ul className="errors">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="card">
        <h2>Datos básicos</h2>
        <div className="form-grid">
          <Field label="Nombre" className="span-2">
            <input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="Nivel">
            <NumberInput value={draft.level} min={1} onChange={(level) => patch({ level })} />
          </Field>
          <Field label="Velocidad (pies)">
            <NumberInput value={draft.speed} min={0} onChange={(speed) => patch({ speed })} />
          </Field>
          <Field label="PG máximos">
            <NumberInput value={draft.hp.max} min={1} onChange={(max) => patch({ hp: { ...draft.hp, max } })} />
          </Field>
          <Field label="Ataques por acción">
            <NumberInput value={draft.attacksPerAction} min={1} onChange={(attacksPerAction) => patch({ attacksPerAction })} />
          </Field>
        </div>
        <p className="hint">Ataques por acción: 1 normal, 2 con Ataque Adicional (nv 5), 3 Guerrero nv 11, 4 Guerrero nv 20.</p>
      </section>

      <section className="card">
        <h2>Recursos</h2>
        <GroupOptions id="resource-groups" items={draft.resources} />
        {draft.resources.length === 0 && <p className="muted">Ki, Furia, espacios de conjuro, usos de rasgos…</p>}
        <div className="edit-list">
          {draft.resources.map((r) => (
            <div key={r.id} className="edit-item">
              <div className="form-grid">
                <Field label="Nombre" className="span-2">
                  <input value={r.name} onChange={(e) => patchResource(r.id, { name: e.target.value })} />
                </Field>
                <Field label="Máximo">
                  <NumberInput value={r.max} min={0} onChange={(max) => patchResource(r.id, { max })} />
                </Field>
                <Field label="Se recarga">
                  <Select value={r.recharge} options={rechargeOptions} onChange={(recharge) => patchResource(r.id, { recharge })} />
                </Field>
                <Field label="Recupera">
                  <Select
                    value={amountKey(r)}
                    options={amountOptions}
                    onChange={(k) => patchResource(r.id, { rechargeAmount: k === 'one' ? 1 : k })}
                  />
                </Field>
                <Field label="Grupo">
                  <input
                    value={r.group ?? ''}
                    placeholder="General"
                    list="resource-groups"
                    onChange={(e) => patchResource(r.id, { group: e.target.value || undefined })}
                  />
                </Field>
              </div>
              <button
                className="btn btn--small btn--ghost-danger"
                onClick={() => setDraft((d) => ({ ...d, resources: d.resources.filter((x) => x.id !== r.id) }))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <div className="row">
          <button className="btn" onClick={() => setDraft((d) => ({ ...d, resources: [...d.resources, newResource()] }))}>
            + Recurso
          </button>
          <button className="btn" onClick={addSpellSlots}>
            + Espacios de conjuro (lanzador completo nv {Number.isNaN(draft.level) ? '?' : draft.level})
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Rasgos y conjuros</h2>
        <GroupOptions id="feature-groups" items={draft.features} />
        {draft.features.length === 0 && <p className="muted">Lo que aparece como botón en combate.</p>}
        <div className="edit-list">
          {draft.features.map((f) => (
            <div key={f.id} className="edit-item">
              <div className="form-grid">
                <Field label="Nombre" className="span-2">
                  <input value={f.name} onChange={(e) => patchFeature(f.id, { name: e.target.value })} />
                </Field>
                <Field label="Cuesta">
                  <Select value={f.cost} options={costOptions} onChange={(cost) => patchFeature(f.id, { cost })} />
                </Field>
                <Field label="Gasta">
                  <Select
                    value={f.resourceId ?? ''}
                    options={resourceOptions}
                    onChange={(id) =>
                      patchFeature(f.id, {
                        resourceId: id || undefined,
                        resourceCost: id ? (f.resourceCost ?? 1) : undefined,
                        upcast: isSpellSlot(id) ? f.upcast : undefined,
                      })
                    }
                  />
                </Field>
                {f.resourceId && (
                  <Field label="Cantidad">
                    <NumberInput value={f.resourceCost ?? 1} min={1} onChange={(resourceCost) => patchFeature(f.id, { resourceCost })} />
                  </Field>
                )}
                <Field label="Efecto">
                  <Select
                    value={(f.effect?.kind ?? 'none') as EffectKey}
                    options={effectOptions}
                    onChange={(kind) =>
                      patchFeature(f.id, {
                        effect: kind === 'grantMovement' ? { kind, amount: 'speed' } : { kind },
                      })
                    }
                  />
                </Field>
                <Field label="Grupo">
                  <input
                    value={f.group ?? ''}
                    placeholder="General"
                    list="feature-groups"
                    onChange={(e) => patchFeature(f.id, { group: e.target.value || undefined })}
                  />
                </Field>
                <Field label="Duración (rondas)">
                  <OptionalNumberInput
                    value={f.durationRounds}
                    min={1}
                    placeholder="—"
                    onChange={(durationRounds) => patchFeature(f.id, { durationRounds })}
                  />
                </Field>
                <label className="check">
                  <input type="checkbox" checked={!!f.concentration} onChange={(e) => patchFeature(f.id, { concentration: e.target.checked })} />
                  Concentración
                </label>
                <Field label="Descripción" className="span-full">
                  <textarea
                    rows={2}
                    value={f.description ?? ''}
                    placeholder="Opcional: CD, daño, alcance, reglas…"
                    onChange={(e) => patchFeature(f.id, { description: e.target.value || undefined })}
                  />
                </Field>
                {isSpellSlot(f.resourceId) && (
                  <label className="check">
                    <input type="checkbox" checked={!!f.upcast} onChange={(e) => patchFeature(f.id, { upcast: e.target.checked })} />
                    Nivel superior
                  </label>
                )}
              </div>
              <button
                className="btn btn--small btn--ghost-danger"
                onClick={() => setDraft((d) => ({ ...d, features: d.features.filter((x) => x.id !== f.id) }))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <p className="hint">Duración: 1 minuto = 10 rondas. Vacío = sin duración. "Nivel superior" permite elegir un espacio más alto al lanzarlo.</p>
        <div className="row">
          <button className="btn" onClick={() => setDraft((d) => ({ ...d, features: [...d.features, newFeature()] }))}>
            + Rasgo o conjuro
          </button>
          <button className="btn" onClick={addBasics}>
            + Acciones básicas (Correr, Ataque de oportunidad)
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Ventajas y defensas</h2>
        {draft.advantages.length === 0 && (
          <p className="muted">Con qué tienes ventaja o desventaja, y a qué eres resistente o inmune.</p>
        )}
        <div className="edit-list">
          {draft.advantages.map((a) => (
            <div key={a.id} className="edit-item">
              <div className="form-grid">
                <Field label="Tipo">
                  <Select value={a.kind} options={advantageOptions} onChange={(kind) => patchAdvantage(a.id, { kind })} />
                </Field>
                <Field label="A qué se aplica" className="span-2">
                  <input
                    value={a.text}
                    placeholder="Ej. salvaciones contra hechizado"
                    onChange={(e) => patchAdvantage(a.id, { text: e.target.value })}
                  />
                </Field>
                <Field label="Fuente">
                  <input
                    value={a.source ?? ''}
                    placeholder="Opcional"
                    onChange={(e) => patchAdvantage(a.id, { source: e.target.value || undefined })}
                  />
                </Field>
              </div>
              <button
                className="btn btn--small btn--ghost-danger"
                onClick={() => setDraft((d) => ({ ...d, advantages: d.advantages.filter((x) => x.id !== a.id) }))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <div className="row">
          <button className="btn" onClick={() => setDraft((d) => ({ ...d, advantages: [...d.advantages, newAdvantage()] }))}>
            + Ventaja o defensa
          </button>
        </div>
      </section>

      <RestPromptsEditor prompts={draft.restPrompts} onChange={(restPrompts) => patch({ restPrompts })} />

      <div className="sticky-save">
        <button className="btn btn--primary btn--big" onClick={save}>
          Guardar
        </button>
      </div>
    </main>
  )
}

/** Sugerencias de grupo: los que ya existen en la lista. */
function GroupOptions({ id, items }: { id: string; items: { group?: string }[] }) {
  const groups = [...new Set(items.map((i) => i.group?.trim()).filter((g): g is string => !!g))]
  return (
    <datalist id={id}>
      {groups.map((g) => (
        <option key={g} value={g} />
      ))}
    </datalist>
  )
}
