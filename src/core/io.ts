import { validateCharacter } from './schema'
import type { Character } from './types'

// Formato del archivo de respaldo. `version` permite migrar si el formato cambia.
const APP = 'dnd-combate'
const VERSION = 1

export function exportCharacters(characters: Character[]): string {
  return JSON.stringify({ app: APP, version: VERSION, exportedAt: new Date().toISOString(), characters }, null, 2)
}

export type ImportResult =
  | { ok: true; characters: Character[]; skipped: string[] }
  | { ok: false; error: string }

/** Lee un respaldo. Acepta el formato completo, una lista o un solo personaje. */
export function parseImport(text: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: 'El archivo no es un JSON válido' }
  }

  let list: unknown[]
  if (Array.isArray(data)) list = data
  else if (data && typeof data === 'object' && Array.isArray((data as { characters?: unknown }).characters))
    list = (data as { characters: unknown[] }).characters
  else if (data && typeof data === 'object') list = [data]
  else return { ok: false, error: 'El archivo no tiene personajes' }

  const characters: Character[] = []
  const skipped: string[] = []
  list.forEach((item, i) => {
    const v = validateCharacter(item)
    if (v.ok) characters.push(v.character)
    else {
      const name = (item as { name?: unknown })?.name
      skipped.push(`${typeof name === 'string' && name ? name : `#${i + 1}`}: ${v.errors[0]}`)
    }
  })
  if (characters.length === 0) return { ok: false, error: `Ningún personaje válido. ${skipped[0] ?? ''}`.trim() }
  return { ok: true, characters, skipped }
}
