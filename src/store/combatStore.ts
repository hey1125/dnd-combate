import { create } from 'zustand'
import { exampleFighter5, exampleSeraphine } from '../core/examples'
import { newId } from '../core/factory'
import { takeDamage } from '../core/hp'
import { longRest, shortRest } from '../core/resources'
import { answerPrompt, promptsFor, type RestKind } from '../core/restPrompts'
import { dropConcentration } from '../core/turn'
import { validateCharacter } from '../core/schema'
import type { Character, Result } from '../core/types'
import type { CharacterRepository } from '../data/repository'

export type LogEntry = { id: number; round: number; text: string }
export type Notice = { kind: 'error' | 'info'; text: string }

type Operation = (character: Character) => Result | Character

type CombatStore = {
  loaded: boolean
  characters: Character[]
  character: Character | null
  history: Character[]
  log: LogEntry[]
  notice: Notice | null
  /** CD de cada salvación de concentración pendiente (una por golpe recibido). */
  concentrationChecks: number[]
  /** Recordatorios de descanso esperando respuesta (ids). */
  pendingPrompts: string[]
  init: (repo: CharacterRepository) => Promise<void>
  select: (id: string) => void
  /** Guarda un personaje creado o editado (ya validado). */
  saveCharacter: (character: Character) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  /** Añade un personaje de ejemplo: el Guerrero simple o Seraphine, más completa. */
  addExample: (which?: 'fighter' | 'seraphine') => Promise<void>
  /** Guarda varios personajes importados (reemplaza los que tengan el mismo id). */
  importCharacters: (characters: Character[], skipped: string[]) => Promise<void>
  /** Aplica una operación del núcleo y la registra en el historial. */
  apply: (label: string, op: Operation) => void
  damage: (amount: number) => void
  /** Resuelve la salvación de concentración pendiente más antigua. */
  resolveConcentration: (passed: boolean) => void
  /** Descansa y deja pendientes los recordatorios que tocan. */
  rest: (kind: RestKind) => void
  answerRestPrompt: (promptId: string, optionIndex: number) => void
  skipRestPrompt: (promptId: string) => void
  /** Cambia las notas sin pasar por el historial de deshacer. */
  setNotes: (notes: string) => void
  undo: () => void
  dismissNotice: () => void
}

const MAX_HISTORY = 50
const MAX_LOG = 100
const ACTIVE_KEY = 'dnd-combate:active'
let repo: CharacterRepository | null = null
let logId = 0
let notesTimer: ReturnType<typeof setTimeout> | undefined

// localStorage solo para recordar cuál personaje estaba abierto (comodidad, no datos importantes).
function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}
function writeActive(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
}

const upsert = (list: Character[], c: Character) =>
  list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]

export const useCombat = create<CombatStore>()((set, get) => {
  const fail = (text: string) => set({ notice: { kind: 'error', text } })

  const persist = (character: Character) => {
    repo?.save(character).catch(() => fail('No se pudo guardar el personaje'))
  }

  /** Cambia el personaje activo guardando el estado anterior para poder deshacer. */
  const commit = (next: Character, label: string, notice: Notice | null = null) => {
    const prev = get().character
    if (!prev) return
    set((s) => ({
      character: next,
      characters: upsert(s.characters, next),
      history: [...s.history, prev].slice(-MAX_HISTORY),
      log: [{ id: ++logId, round: next.turn.round, text: label }, ...s.log].slice(0, MAX_LOG),
      notice,
      concentrationChecks: next.concentratingOn ? s.concentrationChecks : [],
    }))
    persist(next)
  }

  return {
    loaded: false,
    characters: [],
    character: null,
    history: [],
    log: [],
    notice: null,
    concentrationChecks: [],
    pendingPrompts: [],

    init: async (repository) => {
      repo = repository
      try {
        const stored = await repository.list()
        // Descarta lo que esté dañado o con un formato viejo.
        const characters = stored.flatMap((c) => {
          const v = validateCharacter(c)
          return v.ok ? [v.character] : []
        })
        if (characters.length === 0) {
          const example = exampleFighter5()
          await repository.save(example)
          characters.push(example)
        }
        const active = characters.find((c) => c.id === readActive()) ?? characters[0]
        set({ characters, character: active, loaded: true, history: [], log: [], concentrationChecks: [], pendingPrompts: [] })
      } catch {
        const example = exampleFighter5()
        set({ characters: [example], character: example, loaded: true, notice: { kind: 'error', text: 'No se pudo cargar el guardado local' } })
      }
    },

    select: (id) => {
      const character = get().characters.find((c) => c.id === id)
      if (!character) return
      writeActive(id)
      set({ character, history: [], log: [], notice: null, concentrationChecks: [], pendingPrompts: [] })
    },

    saveCharacter: async (character) => {
      try {
        await repo?.save(character)
      } catch {
        return fail('No se pudo guardar el personaje')
      }
      set((s) => {
        const isActive = s.character?.id === character.id
        return {
          characters: upsert(s.characters, character),
          // Si se editó el personaje activo, el "deshacer" anterior ya no aplica.
          character: isActive ? character : s.character,
          history: isActive ? [] : s.history,
          notice: { kind: 'info', text: `${character.name} guardado` },
        }
      })
    },

    deleteCharacter: async (id) => {
      try {
        await repo?.remove(id)
      } catch {
        return fail('No se pudo borrar el personaje')
      }
      set((s) => {
        const characters = s.characters.filter((c) => c.id !== id)
        const wasActive = s.character?.id === id
        const character = wasActive ? (characters[0] ?? null) : s.character
        if (wasActive) writeActive(character?.id ?? null)
        return { characters, character, history: wasActive ? [] : s.history, log: wasActive ? [] : s.log }
      })
    },

    addExample: async (which = 'fighter') => {
      const example = which === 'seraphine' ? exampleSeraphine() : exampleFighter5()
      await get().saveCharacter({ ...example, id: newId() })
    },

    importCharacters: async (characters, skipped) => {
      try {
        await Promise.all(characters.map((c) => repo?.save(c)))
      } catch {
        return fail('No se pudieron guardar los personajes importados')
      }
      set((s) => {
        const list = characters.reduce(upsert, s.characters)
        const active = s.character ? (list.find((c) => c.id === s.character?.id) ?? s.character) : list[0]
        const extra = skipped.length ? ` · Omitidos ${skipped.length}: ${skipped.join('; ')}` : ''
        return {
          characters: list,
          character: active,
          history: [],
          notice: { kind: skipped.length ? 'error' : 'info', text: `Importados ${characters.length} personaje(s)${extra}` },
        }
      })
    },

    apply: (label, op) => {
      const current = get().character
      if (!current) return
      const out = op(current)
      if ('ok' in out) {
        if (!out.ok) return fail(out.error)
        commit(out.character, label, out.warning ? { kind: 'info', text: out.warning } : null)
      } else {
        commit(out, label)
      }
    },

    damage: (amount) => {
      const current = get().character
      if (!current || amount <= 0) return
      const { character, concentrationDC, notes } = takeDamage(current, amount)
      const texts = [...notes]
      if (concentrationDC) texts.push(`Salvación de CON CD ${concentrationDC} para mantener ${current.concentratingOn}`)
      const notice: Notice | null = texts.length ? { kind: 'info', text: texts.join(' · ') } : null
      commit(character, `Recibe ${amount} de daño`, notice)
      if (concentrationDC && character.concentratingOn) set((s) => ({ concentrationChecks: [...s.concentrationChecks, concentrationDC] }))
    },

    resolveConcentration: (passed) => {
      const { character, concentrationChecks } = get()
      const dc = concentrationChecks[0]
      if (!character || dc === undefined) return
      if (passed) {
        commit(character, `Mantiene la concentración en ${character.concentratingOn} (CD ${dc})`)
        set({ concentrationChecks: concentrationChecks.slice(1) })
      } else {
        // Al perder la concentración, commit limpia el resto de salvaciones pendientes.
        commit(dropConcentration(character), `Pierde la concentración en ${character.concentratingOn} (falló CD ${dc})`)
      }
    },

    undo: () => {
      const { history, log, character } = get()
      const snapshot = history.at(-1)
      if (!snapshot) return
      // Las notas no forman parte del historial: deshacer nunca borra lo que escribiste.
      const prev = { ...snapshot, notes: character?.notes }
      set((s) => ({
        character: prev,
        characters: upsert(s.characters, prev),
        history: history.slice(0, -1),
        log: log.slice(1),
        notice: null,
        concentrationChecks: [],
        pendingPrompts: [],
      }))
      persist(prev)
    },

    rest: (kind) => {
      const current = get().character
      if (!current) return
      commit(kind === 'short' ? shortRest(current) : longRest(current), kind === 'short' ? 'Descanso corto' : 'Descanso largo')
      set({ pendingPrompts: promptsFor(current, kind).map((p) => p.id) })
    },

    answerRestPrompt: (promptId, optionIndex) => {
      const current = get().character
      const prompt = current?.restPrompts.find((p) => p.id === promptId)
      const option = prompt?.options[optionIndex]
      if (!current || !prompt || !option) return
      commit(answerPrompt(current, promptId, optionIndex), `${prompt.question} → ${option.label}`)
      set((s) => ({ pendingPrompts: s.pendingPrompts.filter((id) => id !== promptId) }))
    },

    skipRestPrompt: (promptId) => set((s) => ({ pendingPrompts: s.pendingPrompts.filter((id) => id !== promptId) })),

    setNotes: (notes) => {
      const current = get().character
      if (!current) return
      const next = { ...current, notes }
      set((s) => ({ character: next, characters: upsert(s.characters, next) }))
      // Guarda cuando dejas de escribir, no en cada tecla.
      clearTimeout(notesTimer)
      notesTimer = setTimeout(() => persist(get().character ?? next), 500)
    },

    dismissNotice: () => set({ notice: null }),
  }
})
