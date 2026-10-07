import { freshTurn } from './turn'
import type { Character } from './types'

/** Personaje de ejemplo: Guerrero nivel 5 con Ataque Adicional. */
export function exampleFighter5(): Character {
  const base: Omit<Character, 'turn'> = {
    id: 'fighter-5',
    name: 'Guerrero de prueba',
    level: 5,
    speed: 30,
    attacksPerAction: 2,
    hp: { current: 44, max: 44, temp: 0 },
    concentratingOn: null,
    resources: [
      { id: 'second-wind', name: 'Tomar Aliento', max: 2, current: 2, recharge: 'longRest', rechargeAmount: 1 },
      { id: 'action-surge', name: 'Oleada de Acción', max: 1, current: 1, recharge: 'shortRest' },
      { id: 'hit-dice', name: 'Dados de Golpe (d10)', max: 5, current: 5, recharge: 'longRest', rechargeAmount: 'half' },
    ],
    features: [
      { id: 'second-wind', name: 'Tomar Aliento', cost: 'bonusAction', resourceId: 'second-wind' },
      { id: 'action-surge', name: 'Oleada de Acción', cost: 'free', resourceId: 'action-surge', effect: { kind: 'grantAction' } },
      { id: 'dash', name: 'Correr', cost: 'action', effect: { kind: 'grantMovement', amount: 'speed' } },
    ],
  }
  return { ...base, turn: freshTurn(base as Character, 1) }
}
