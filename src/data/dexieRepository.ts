import Dexie, { type EntityTable } from 'dexie'
import type { Character } from '../core/types'
import type { CharacterRepository } from './repository'

class Database extends Dexie {
  characters!: EntityTable<Character, 'id'>

  constructor() {
    super('dnd-combate')
    this.version(1).stores({ characters: 'id, name' })
  }
}

const db = new Database()

/** Guarda los personajes en el navegador (IndexedDB). Funciona sin internet. */
export const dexieRepository: CharacterRepository = {
  list: () => db.characters.toArray(),
  get: (id) => db.characters.get(id),
  save: async (character) => {
    await db.characters.put(character)
  },
  remove: (id) => db.characters.delete(id),
}
