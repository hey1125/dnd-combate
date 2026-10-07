import { create } from 'zustand'
import { exampleFighter5 } from '../core/examples'
import { takeDamage } from '../core/hp'
import type { Character, Result } from '../core/types'
import type { CharacterRepository } from '../data/repository'

export type LogEntry = { id: number; round: number; text: string }
export type Notice = { kind: 'error' | 'info'; text: string }

type Operation = (character: Character) => Result | Character

type CombatStore = {
  character: Character | null
  history: Character[]
  log: LogEntry[]
  notice: Notice | null
  init: (repo: CharacterRepository) => Promise<void>
  /** Aplica una operación del núcleo y la registra en el historial. */
  apply: (label: string, op: Operation) => void
  damage: (amount: number) => void
  undo: () => void
  resetToExample: () => void
  dismissNotice: () => void
}

const MAX_HISTORY = 50
const MAX_LOG = 100
let repo: CharacterRepository | null = null
let logId = 0

function persist(character: Character, onError: (text: string) => void) {
  repo?.save(character).catch(() => onError('No se pudo guardar el personaje'))
}

export const useCombat = create<CombatStore>()((set, get) => {
  const fail = (text: string) => set({ notice: { kind: 'error', text } })

  /** Cambia el personaje guardando el estado anterior para poder deshacer. */
  const commit = (next: Character, label: string, notice: Notice | null = null) => {
    const prev = get().character
    if (!prev) return
    set((s) => ({
      character: next,
      history: [...s.history, prev].slice(-MAX_HISTORY),
      log: [{ id: ++logId, round: next.turn.round, text: label }, ...s.log].slice(0, MAX_LOG),
      notice,
    }))
    persist(next, fail)
  }

  return {
    character: null,
    history: [],
    log: [],
    notice: null,

    init: async (repository) => {
      repo = repository
      try {
        const [saved] = await repository.list()
        const character = saved ?? exampleFighter5()
        if (!saved) await repository.save(character)
        set({ character })
      } catch {
        set({ character: exampleFighter5(), notice: { kind: 'error', text: 'No se pudo cargar el guardado local' } })
      }
    },

    apply: (label, op) => {
      const current = get().character
      if (!current) return
      const out = op(current)
      if ('ok' in out) {
        if (!out.ok) return fail(out.error)
        commit(out.character, label)
      } else {
        commit(out, label)
      }
    },

    damage: (amount) => {
      const current = get().character
      if (!current || amount <= 0) return
      const { character, concentrationDC } = takeDamage(current, amount)
      const notice: Notice | null = concentrationDC
        ? { kind: 'info', text: `Salvación de CON CD ${concentrationDC} para mantener ${current.concentratingOn}` }
        : null
      commit(character, `Recibe ${amount} de daño`, notice)
    },

    undo: () => {
      const { history, log } = get()
      const prev = history.at(-1)
      if (!prev) return
      set({ character: prev, history: history.slice(0, -1), log: log.slice(1), notice: null })
      persist(prev, fail)
    },

    resetToExample: () => {
      const fresh = exampleFighter5()
      set({ character: fresh, history: [], log: [], notice: null })
      persist(fresh, fail)
    },

    dismissNotice: () => set({ notice: null }),
  }
})
