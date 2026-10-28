import { getResource } from '../core/resources'
import { slotLevel } from '../core/spells'
import type { Character, Feature } from '../core/types'

/**
 * Motivo corto por el que un rasgo no se puede usar ahora, para mostrarlo bajo el botón.
 * null si se puede usar. El mensaje completo del núcleo sigue disponible al pasar el mouse.
 */
export function blockedReason(character: Character, feature: Feature, canUpcast = false): string | null {
  if (character.hp.current === 0) return 'Estás a 0 PG'
  const t = character.turn
  if (feature.cost === 'action' && !t.actionAvailable) return 'Ya usaste tu acción'
  if (feature.cost === 'bonusAction' && !t.bonusActionAvailable) return 'Ya usaste tu acción adicional'
  if (feature.cost === 'reaction' && !t.reactionAvailable) return 'Ya usaste tu reacción'
  if (feature.resourceId && !canUpcast) {
    const r = getResource(character, feature.resourceId)
    if (!r) return 'Falta su recurso'
    if (r.current < (feature.resourceCost ?? 1)) {
      const level = slotLevel(feature.resourceId)
      return level !== null ? `Sin espacios de nivel ${level}${feature.upcast ? ' o más' : ''}` : 'Sin usos'
    }
  }
  return null
}
