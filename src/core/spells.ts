import type { Character, Feature, Resource } from './types'

/** Nivel del espacio de conjuro si el recurso es "slot-N"; si no, null. */
export function slotLevel(resourceId: string | undefined): number | null {
  const match = resourceId?.match(/^slot-(\d)$/)
  return match ? Number(match[1]) : null
}

export const isSpellSlot = (resourceId: string | undefined) => slotLevel(resourceId) !== null

/** Espacios con los que se puede lanzar este conjuro (su nivel o superior, con usos). */
export function castOptions(character: Character, feature: Feature): Resource[] {
  const base = slotLevel(feature.resourceId)
  if (base === null) return []
  const cost = feature.resourceCost ?? 1
  return character.resources
    .filter((r) => {
      const level = slotLevel(r.id)
      if (level === null) return false
      return feature.upcast ? level >= base : level === base
    })
    .filter((r) => r.current >= cost)
    .sort((a, b) => (slotLevel(a.id) ?? 0) - (slotLevel(b.id) ?? 0))
}
