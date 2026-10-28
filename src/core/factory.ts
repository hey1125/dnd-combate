import { newId } from './id'
import { freshTurn } from './turn'
import type { Advantage, Character, Feature, Resource } from './types'

export { newId }

/** Personaje vacío listo para editar. */
export function newCharacter(): Character {
  const base: Omit<Character, 'turn'> = {
    id: newId(),
    name: 'Nuevo personaje',
    level: 1,
    speed: 30,
    attacksPerAction: 1,
    hp: { current: 10, max: 10, temp: 0 },
    resources: [],
    features: [],
    concentratingOn: null,
    effects: [],
    advantages: [],
    restPrompts: [],
    deathSaves: { successes: 0, failures: 0, stable: false },
  }
  return { ...base, turn: freshTurn(base as Character, 1) }
}

export function newResource(partial: Partial<Resource> = {}): Resource {
  return { id: newId(), name: 'Nuevo recurso', max: 1, current: 1, recharge: 'longRest', ...partial }
}

export function newAdvantage(partial: Partial<Advantage> = {}): Advantage {
  return { id: newId(), kind: 'advantage', text: '', ...partial }
}

export function newFeature(partial: Partial<Feature> = {}): Feature {
  return { id: newId(), name: 'Nuevo rasgo', cost: 'action', ...partial }
}

/** Espacios de conjuro de un lanzador completo (Mago, Clérigo, Druida, Bardo, Hechicero) según su nivel. */
const FULL_CASTER_SLOTS: number[][] = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2],
  [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

export function fullCasterSlots(level: number): Resource[] {
  const table = FULL_CASTER_SLOTS[Math.min(20, Math.max(1, level)) - 1]
  return table.map((max, i) =>
    newResource({ id: `slot-${i + 1}`, name: `Espacios nivel ${i + 1}`, max, current: max, recharge: 'longRest' }),
  )
}

/**
 * Aplica los cambios del editor de forma segura:
 * - Recursos nuevos empiezan llenos; si sube el máximo, sube lo actual; nunca pasa del máximo.
 * - Los PG actuales se ajustan si cambia el máximo.
 * - Rasgos que apuntaban a un recurso borrado dejan de consumirlo.
 */
export function applyEdits(previous: Character | null, draft: Character): Character {
  const prevResources = new Map(previous?.resources.map((r) => [r.id, r]))

  const resources = draft.resources.map((r) => {
    const before = prevResources.get(r.id)
    const current = before ? before.current + Math.max(0, r.max - before.max) : r.max
    return { ...r, current: Math.min(r.max, Math.max(0, current)) }
  })
  const ids = new Set(resources.map((r) => r.id))

  const features = draft.features.map((f) =>
    f.resourceId && !ids.has(f.resourceId) ? { ...f, resourceId: undefined, resourceCost: undefined } : f,
  )

  const prevHp = previous?.hp
  const hpCurrent = prevHp ? prevHp.current + Math.max(0, draft.hp.max - prevHp.max) : draft.hp.max

  const next: Character = {
    ...draft,
    resources,
    features,
    hp: { ...draft.hp, current: Math.min(draft.hp.max, hpCurrent) },
  }
  // Si es nuevo, o cambió la velocidad, reinicia el turno para que el movimiento cuadre.
  if (!previous || previous.speed !== draft.speed) next.turn = freshTurn(next, draft.turn.round)
  return next
}
