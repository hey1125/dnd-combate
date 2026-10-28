import type { Character, EffectRule } from './types'

/** Lo que implica un estado. `against` = algo que afecta a quien te ataca, no a ti. */
export type ConditionRule = EffectRule

/** Reglas de los estados (D&D 5e 2014, SRD) para recordarlas en mesa. Las claves van sin tildes y en minúscula. */
const RULES: Record<string, ConditionRule[]> = {
  agarrado: [{ kind: 'note', text: 'Tu velocidad es 0' }],
  apresado: [
    { kind: 'note', text: 'Tu velocidad es 0' },
    { kind: 'disadvantage', text: 'Tus tiradas de ataque' },
    { kind: 'disadvantage', text: 'Salvaciones de DES' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja' },
  ],
  asustado: [
    { kind: 'disadvantage', text: 'Pruebas de característica y ataques mientras veas la fuente del miedo' },
    { kind: 'note', text: 'No puedes acercarte voluntariamente a la fuente' },
  ],
  aturdido: [
    { kind: 'note', text: 'Incapacitado: sin acciones ni reacciones; no puedes moverte' },
    { kind: 'note', text: 'Fallas automáticamente las salvaciones de FUE y DES' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja' },
  ],
  cegado: [
    { kind: 'disadvantage', text: 'Tus tiradas de ataque' },
    { kind: 'note', text: 'Fallas las pruebas que requieren ver' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja' },
  ],
  derribado: [
    { kind: 'disadvantage', text: 'Tus tiradas de ataque' },
    { kind: 'against', text: 'Ventaja si te atacan a 5 pies; desventaja si es desde más lejos' },
    { kind: 'note', text: 'Levantarte cuesta la mitad de tu velocidad' },
  ],
  ensordecido: [{ kind: 'note', text: 'Fallas las pruebas que requieren oír' }],
  envenenado: [{ kind: 'disadvantage', text: 'Tiradas de ataque y pruebas de característica' }],
  hechizado: [
    { kind: 'note', text: 'No puedes atacar a quien te hechizó' },
    { kind: 'against', text: 'Quien te hechizó tiene ventaja en pruebas sociales contigo' },
  ],
  incapacitado: [{ kind: 'note', text: 'Sin acciones ni reacciones' }],
  inconsciente: [
    { kind: 'note', text: 'Incapacitado, sueltas lo que llevas y caes derribado' },
    { kind: 'note', text: 'Fallas automáticamente las salvaciones de FUE y DES' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja; a 5 pies, todo impacto es crítico' },
  ],
  invisible: [
    { kind: 'advantage', text: 'Tus tiradas de ataque' },
    { kind: 'against', text: 'Los ataques contra ti tienen desventaja' },
  ],
  paralizado: [
    { kind: 'note', text: 'Incapacitado: sin acciones ni reacciones; no puedes moverte' },
    { kind: 'note', text: 'Fallas automáticamente las salvaciones de FUE y DES' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja; a 5 pies, todo impacto es crítico' },
  ],
  petrificado: [
    { kind: 'note', text: 'Incapacitado: sin acciones ni reacciones; no puedes moverte' },
    { kind: 'resistance', text: 'Todo el daño' },
    { kind: 'immunity', text: 'Veneno y enfermedad' },
    { kind: 'note', text: 'Fallas automáticamente las salvaciones de FUE y DES' },
    { kind: 'against', text: 'Los ataques contra ti tienen ventaja' },
  ],
  agotamiento: [
    { kind: 'disadvantage', text: 'Pruebas de característica (nivel 1+)' },
    { kind: 'note', text: 'Nivel 2+: velocidad a la mitad · 3+: desventaja en ataques y salvaciones · 4+: PG máximos a la mitad' },
  ],
}

const key = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Reglas de un estado por su nombre. Acepta variantes como "Agotamiento 2" o "derribado". */
export function conditionRules(name: string): ConditionRule[] {
  const k = key(name)
  if (RULES[k]) return RULES[k]
  const first = k.split(/[\s(]/)[0]
  return RULES[first] ?? []
}

/** Estados activos que tienen reglas (propias o del SRD), con sus reglas. */
export function activeConditionRules(character: Character): { name: string; rules: ConditionRule[] }[] {
  return character.effects
    .map((e) => ({ name: e.name, rules: [...(e.rules ?? []), ...conditionRules(e.name)] }))
    .filter((c) => c.rules.length > 0)
}
