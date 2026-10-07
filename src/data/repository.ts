import type { Character } from '../core/types'

/**
 * Contrato para guardar personajes.
 * Hoy lo implementa Dexie (local). Cuando exista la API de Nivel20,
 * se crea otra implementación con esta misma forma y el resto de la app no cambia.
 */
export interface CharacterRepository {
  list(): Promise<Character[]>
  get(id: string): Promise<Character | undefined>
  save(character: Character): Promise<void>
  remove(id: string): Promise<void>
}
