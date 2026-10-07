// Tipos del núcleo de reglas. Sin React ni base de datos: solo datos.

/** Cuándo se recarga un recurso. */
export type Recharge = 'turn' | 'shortRest' | 'longRest' | 'never'

/** Cuánto se recupera al recargar: todo, la mitad (redondeo hacia abajo, mínimo 1) o una cantidad fija. */
export type RechargeAmount = 'all' | 'half' | number

/** Cualquier cosa que se gasta y se recupera: espacios de conjuro, Ki, Furia, Oleada de Acción... */
export type Resource = {
  id: string
  name: string
  max: number
  current: number
  recharge: Recharge
  rechargeAmount?: RechargeAmount // por defecto 'all'
}

/** Lo que cuesta usar algo dentro del turno. */
export type ActionCost = 'action' | 'bonusAction' | 'reaction' | 'free'

/** Economía de acciones del turno actual. */
export type TurnState = {
  round: number
  actionAvailable: boolean
  bonusActionAvailable: boolean
  reactionAvailable: boolean
  movementRemaining: number
  /** Ataques que quedan de la acción de Atacar ya iniciada. */
  attacksRemaining: number
}

/** Efectos especiales que puede tener un rasgo. */
export type FeatureEffect =
  | { kind: 'none' }
  | { kind: 'grantAction' } // Oleada de Acción
  | { kind: 'grantMovement'; amount: 'speed' | number } // Correr / Dash

/** Un rasgo, conjuro o habilidad que se puede usar en combate. */
export type Feature = {
  id: string
  name: string
  cost: ActionCost
  /** Recurso que consume (opcional) y cuánto. */
  resourceId?: string
  resourceCost?: number
  /** Si es un conjuro de concentración. */
  concentration?: boolean
  effect?: FeatureEffect
}

export type HitPoints = {
  current: number
  max: number
  temp: number
}

export type Character = {
  id: string
  name: string
  level: number
  speed: number
  /** 1 normal, 2 con Ataque Adicional, 3 Guerrero nv 11, 4 Guerrero nv 20. */
  attacksPerAction: number
  hp: HitPoints
  resources: Resource[]
  features: Feature[]
  /** Nombre del efecto que se está concentrando, o null. */
  concentratingOn: string | null
  turn: TurnState
}

/** Resultado de una operación: o el nuevo personaje o el motivo por el que no se pudo. */
export type Result =
  | { ok: true; character: Character }
  | { ok: false; error: string }
