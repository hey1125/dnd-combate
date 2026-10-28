import type { ActionCost, AdvantageKind, Recharge } from '../core/types'

export const costLabel: Record<ActionCost, string> = {
  action: 'Acción',
  bonusAction: 'Adicional',
  reaction: 'Reacción',
  free: 'Gratis',
}

export const rechargeLabel: Record<Recharge, string> = {
  turn: 'por turno',
  shortRest: 'desc. corto',
  longRest: 'desc. largo',
  never: 'no se recarga',
}

export const advantageLabel: Record<AdvantageKind, string> = {
  advantage: 'Ventaja',
  disadvantage: 'Desventaja',
  resistance: 'Resistencia',
  immunity: 'Inmunidad',
}
