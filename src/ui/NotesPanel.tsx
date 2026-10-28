import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

/** Notas libres de la sesión. Se guardan solas con el personaje. */
export function NotesPanel({ character }: { character: Character }) {
  const setNotes = useCombat((s) => s.setNotes)
  return (
    <section className="card">
      <h2>Notas</h2>
      <textarea
        className="notes"
        rows={4}
        aria-label="Notas de la sesión"
        placeholder="Lo que quieras recordar: «el ogro tiene 12 PG menos», «le debo 50 po a Larry»…"
        value={character.notes ?? ''}
        onChange={(e) => setNotes(e.target.value)}
      />
      <p className="hint">Se guardan solas. Deshacer no las toca.</p>
    </section>
  )
}
