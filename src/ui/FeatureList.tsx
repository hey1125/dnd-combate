import { useState } from 'react'
import { getResource } from '../core/resources'
import { castOptions, slotLevel } from '../core/spells'
import { applyFeature } from '../core/turn'
import type { ActionCost, Character, Feature } from '../core/types'
import { useCombat } from '../store/combatStore'
import { groupItems, normalize } from './groups'
import { SEARCH_INPUT_ID } from './shortcuts'
import { costLabel } from './labels'
import { blockedReason } from './reasons'

type CostFilter = ActionCost | 'all'
const costFilters: CostFilter[] = ['all', 'action', 'bonusAction', 'reaction', 'free']

export function FeatureList({ character }: { character: Character }) {
  const apply = useCombat((s) => s.apply)
  const [choosing, setChoosing] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [costFilter, setCostFilter] = useState<CostFilter>('all')
  const [onlyUsable, setOnlyUsable] = useState(false)
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  if (character.features.length === 0) return null

  const use = (f: Feature, slotId?: string) => {
    const level = slotLevel(slotId)
    const label = level !== null && slotId !== f.resourceId ? `Usa ${f.name} (nivel ${level})` : `Usa ${f.name}`
    apply(label, (c) => applyFeature(c, f, { slotId }))
    setChoosing(null)
  }

  // Calcula una vez por rasgo si se puede usar ahora mismo.
  const rows = character.features.map((f) => {
    const check = applyFeature(character, f)
    const options = f.upcast ? castOptions(character, f) : []
    // Se puede subir de nivel si hay algún espacio superior disponible, aunque el base esté agotado.
    const canUpcast = options.length > 0 && applyFeature(character, f, { slotId: options[0].id }).ok
    const enabled = check.ok || canUpcast
    // Motivo corto si está bloqueado; si el núcleo da otro motivo, se usa ese.
    const reason = enabled ? null : (blockedReason(character, f, canUpcast) ?? (check.ok ? null : check.error))
    return { f, check, options, enabled, reason }
  })

  const q = normalize(query.trim())
  const visible = rows.filter(
    (r) =>
      (costFilter === 'all' || r.f.cost === costFilter) &&
      (!onlyUsable || r.enabled) &&
      (!q || normalize(`${r.f.name} ${r.f.group ?? ''} ${r.f.description ?? ''}`).includes(q)),
  )
  const groups = groupItems(visible.map((r) => ({ ...r, group: r.f.group })))
  const filtering = q !== '' || costFilter !== 'all' || onlyUsable
  const countFor = (c: CostFilter) => (c === 'all' ? rows.length : rows.filter((r) => r.f.cost === c).length)

  return (
    <section className="card">
      <h2>Rasgos y conjuros</h2>

      <div className="feature-tools">
        <input
          type="search"
          id={SEARCH_INPUT_ID}
          className="feature-search"
          placeholder="Buscar… ( / )"
          aria-label="Buscar rasgo o conjuro"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Esc limpia la búsqueda y devuelve el teclado a los atajos.
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              e.currentTarget.blur()
            }
          }}
        />
        <div className="chips" role="group" aria-label="Filtrar por costo">
          {costFilters
            .filter((c) => c === 'all' || countFor(c) > 0)
            .map((c) => (
              <button
                key={c}
                className={`chip chip--${c} ${costFilter === c ? 'chip--on' : ''}`}
                aria-pressed={costFilter === c}
                onClick={() => setCostFilter(c)}
              >
                {c === 'all' ? 'Todo' : costLabel[c]} <span className="chip__count">{countFor(c)}</span>
              </button>
            ))}
        </div>
        <label className="check">
          <input type="checkbox" checked={onlyUsable} onChange={(e) => setOnlyUsable(e.target.checked)} />
          Solo lo que puedo usar ahora
        </label>
      </div>

      {visible.length === 0 && <p className="muted">Nada coincide con el filtro.</p>}

      {groups.map((g, i) => {
        const usable = g.items.filter((r) => r.enabled).length
        return (
          // El primer grupo queda abierto; al filtrar se abren todos para que se vea lo encontrado.
          <details key={g.name} className="group" open={filtering || i === 0 || undefined}>
            <summary className="group__head">
              <span className="group__name">{g.name}</span>
              <span className="group__count">
                {usable}/{g.items.length} disponibles
              </span>
            </summary>
            <div className="features">
              {g.items.map(({ f, check, options, enabled, reason }) => {
                const res = f.resourceId ? getResource(character, f.resourceId) : undefined
                const base = slotLevel(f.resourceId)
                return (
                  <div key={f.id} className="feature-wrap">
                    <div className="feature-row">
                      <button
                        className="btn feature"
                        disabled={!enabled}
                        title={enabled ? undefined : check.ok ? undefined : check.error}
                        aria-expanded={f.upcast ? choosing === f.id : undefined}
                        onClick={() =>
                          f.upcast && options.length > 1 ? setChoosing(choosing === f.id ? null : f.id) : use(f, options[0]?.id)
                        }
                      >
                        <span className="feature__text">
                          <span className="feature__name">
                            {f.name}
                            {base !== null && (
                              <span className="feature__level">
                                {' '}
                                · nv {base}
                                {f.upcast ? '+' : ''}
                              </span>
                            )}
                          </span>
                          {reason && <span className="feature__reason">{reason}</span>}
                        </span>
                        <span className="feature__meta">
                          {f.durationRounds && <span className="tag">{f.durationRounds} r</span>}
                          {f.concentration && <span className="tag">Conc.</span>}
                          <span className={`tag tag--${f.cost}`}>{costLabel[f.cost]}</span>
                          {res && (
                            <span className="feature__uses">
                              {res.current}/{res.max}
                            </span>
                          )}
                        </span>
                      </button>
                      {f.description && (
                        <button
                          className="btn btn--icon feature__info"
                          aria-expanded={open.has(f.id)}
                          aria-label={`${open.has(f.id) ? 'Ocultar' : 'Ver'} descripción de ${f.name}`}
                          title="Descripción"
                          onClick={() => toggle(f.id)}
                        >
                          {open.has(f.id) ? '−' : 'i'}
                        </button>
                      )}
                    </div>
                    {f.description && open.has(f.id) && <p className="feature__desc">{f.description}</p>}

                    {choosing === f.id && (
                      <div className="slot-picker" role="group" aria-label={`Elegir espacio para ${f.name}`}>
                        <span className="muted">Lanzar con espacio de:</span>
                        {options.map((r) => (
                          <button key={r.id} className="btn btn--small" onClick={() => use(f, r.id)}>
                            Nv {slotLevel(r.id)} <span className="muted">({r.current})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </details>
        )
      })}
    </section>
  )
}
