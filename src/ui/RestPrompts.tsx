import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

/** Preguntas que quedaron pendientes tras un descanso (por ejemplo, el trastorno del día). */
export function RestPrompts({ character }: { character: Character }) {
  const pending = useCombat((s) => s.pendingPrompts)
  const answer = useCombat((s) => s.answerRestPrompt)
  const skip = useCombat((s) => s.skipRestPrompt)
  const prompts = pending.flatMap((id) => character.restPrompts.filter((p) => p.id === id))
  if (prompts.length === 0) return null

  return (
    <section className="card rest-prompts" aria-label="Recordatorios del descanso">
      <h2>Tras el descanso</h2>
      {prompts.map((p) => (
        <div key={p.id} className="rest-prompt">
          <p className="rest-prompt__question">{p.question}</p>
          <div className="rest-prompt__options">
            {p.options.map((o, i) => (
              <button
                key={i}
                className="btn btn--small"
                onClick={() => answer(p.id, i)}
              >
                {o.label}
              </button>
            ))}
            <button className="btn btn--small btn--link" onClick={() => skip(p.id)}>
              Omitir
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}
