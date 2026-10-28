import { z } from 'zod'
import type { Character } from './types'

// Valida personajes al guardarlos desde el editor y al cargarlos.
// Cuando llegue la API de Nivel20, aquí también se validará lo que venga de fuera.

const recharge = z.enum(['turn', 'shortRest', 'longRest', 'never'])
const cost = z.enum(['action', 'bonusAction', 'reaction', 'free'])
const int = (min: number, label: string) =>
  z.number({ error: `${label}: debe ser un número` }).int(`${label}: debe ser entero`).min(min, `${label}: mínimo ${min}`)

const resourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Cada recurso necesita nombre'),
  max: int(0, 'Máximo del recurso'),
  current: int(0, 'Usos actuales'),
  recharge,
  rechargeAmount: z.union([z.literal('all'), z.literal('half'), z.number().int().min(1)]).optional(),
  group: z.string().trim().optional(),
})

const effectSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('grantAction') }),
  z.object({ kind: z.literal('grantMovement'), amount: z.union([z.literal('speed'), z.number().int().min(1)]) }),
])

const advantageKind = z.enum(['advantage', 'disadvantage', 'resistance', 'immunity'])
const ruleSchema = z.object({
  kind: z.union([advantageKind, z.literal('against'), z.literal('note')]),
  text: z.string().trim().min(1, 'Cada regla necesita texto'),
})

const featureSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Cada rasgo necesita nombre'),
  cost,
  resourceId: z.string().optional(),
  resourceCost: z.number().int().min(1).optional(),
  concentration: z.boolean().optional(),
  upcast: z.boolean().optional(),
  durationRounds: int(1, 'Duración (rondas)').optional(),
  effect: effectSchema.optional(),
  description: z.string().trim().optional(),
  group: z.string().trim().optional(),
})

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'El personaje necesita nombre'),
  level: int(1, 'Nivel').max(20, 'Nivel: máximo 20'),
  speed: int(0, 'Velocidad'),
  attacksPerAction: int(1, 'Ataques por acción').max(4, 'Ataques por acción: máximo 4'),
  hp: z.object({ current: int(0, 'PG actuales'), max: int(1, 'PG máximos'), temp: int(0, 'PG temporales') }),
  resources: z.array(resourceSchema),
  features: z.array(featureSchema),
  concentratingOn: z.string().nullable(),
  // Los campos nuevos tienen valor por defecto para que los personajes guardados antes sigan cargando.
  effects: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(1, 'Cada efecto necesita nombre'),
        roundsLeft: z.number().int().min(0).nullable(),
        concentration: z.boolean().optional(),
        rules: z.array(ruleSchema).optional(),
        promptId: z.string().optional(),
      }),
    )
    .default([]),
  advantages: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: advantageKind,
        text: z.string().trim().min(1, 'Cada ventaja o defensa necesita texto'),
        source: z.string().trim().optional(),
      }),
    )
    .default([]),
  restPrompts: z
    .array(
      z.object({
        id: z.string().min(1),
        question: z.string().trim().min(1, 'Cada recordatorio necesita una pregunta'),
        after: z.enum(['short', 'long', 'both']),
        options: z
          .array(
            z.object({
              label: z.string().trim().min(1, 'Cada respuesta necesita texto'),
              effect: z
                .object({ name: z.string().trim().min(1, 'El estado de una respuesta necesita nombre'), rules: z.array(ruleSchema).optional() })
                .optional(),
            }),
          )
          .min(1, 'Cada recordatorio necesita al menos una respuesta'),
      }),
    )
    .default([]),
  notes: z.string().optional(),
  deathSaves: z
    .object({ successes: z.number().int().min(0).max(3), failures: z.number().int().min(0).max(3), stable: z.boolean() })
    .default({ successes: 0, failures: 0, stable: false }),
  combatStart: z.record(z.string(), z.number().int().min(0)).optional(),
  turn: z.object({
    round: z.number().int().min(1),
    actionAvailable: z.boolean(),
    bonusActionAvailable: z.boolean(),
    reactionAvailable: z.boolean(),
    movementRemaining: z.number().int().min(0),
    attacksRemaining: z.number().int().min(0),
    slotsSpent: z.number().int().min(0).default(0),
  }),
})

export type Validation = { ok: true; character: Character } | { ok: false; errors: string[] }

export function validateCharacter(data: unknown): Validation {
  const parsed = characterSchema.safeParse(data)
  if (parsed.success) return { ok: true, character: parsed.data as Character }
  return { ok: false, errors: [...new Set(parsed.error.issues.map((i) => i.message))] }
}
