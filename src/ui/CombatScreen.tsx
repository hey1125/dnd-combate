import { startTurn } from '../core/turn'
import { useCombat } from '../store/combatStore'
import { AdvantagesPanel } from './AdvantagesPanel'
import { DeathSavesPanel } from './DeathSavesPanel'
import { EffectsPanel } from './EffectsPanel'
import { FeatureList } from './FeatureList'
import { HpPanel } from './HpPanel'
import { NotesPanel } from './NotesPanel'
import { ResourceList } from './ResourceList'
import { RestPanel } from './RestPanel'
import { RestPrompts } from './RestPrompts'
import { SEARCH_INPUT_ID, useShortcuts } from './shortcuts'
import { TurnPanel } from './TurnPanel'

type Props = { onOpenList: () => void; onEdit: () => void }

export function CombatScreen({ onOpenList, onEdit }: Props) {
  const character = useCombat((s) => s.character)
  const log = useCombat((s) => s.log)
  const notice = useCombat((s) => s.notice)
  const canUndo = useCombat((s) => s.history.length > 0)
  const { apply, undo, dismissNotice } = useCombat.getState()

  useShortcuts({
    nextTurn: () => {
      const c = useCombat.getState().character
      if (c) apply(`Empieza la ronda ${c.turn.round + 1}`, startTurn)
    },
    undo: () => {
      if (useCombat.getState().history.length > 0) undo()
    },
    search: () => {
      const input = document.getElementById(SEARCH_INPUT_ID)
      input?.scrollIntoView({ block: 'nearest' })
      input?.focus()
    },
  })

  if (!character) return <p className="loading">Cargando…</p>

  return (
    <main className="app app--combat">
      <header className="top">
        <div>
          <h1>{character.name}</h1>
          <p className="subtitle">
            Nivel {character.level} · Ronda {character.turn.round} ·{' '}
            <span className={character.hp.current === 0 ? 'subtitle__bad' : undefined}>
              {character.hp.current}/{character.hp.max} PG
              {character.hp.temp > 0 && ` (+${character.hp.temp})`}
            </span>
            {character.concentratingOn && (
              <>
                {' '}
                · <span className="subtitle__conc">Conc.: {character.concentratingOn}</span>
              </>
            )}
          </p>
        </div>
        <div className="top__actions">
          <button className="btn btn--small" disabled={!canUndo} onClick={undo}>
            ↶ Deshacer <kbd>Ctrl+Z</kbd>
          </button>
          <button className="btn btn--small" onClick={onEdit}>
            Editar
          </button>
          <button className="btn btn--small" onClick={onOpenList}>
            Personajes
          </button>
        </div>
      </header>

      {notice && (
        <div className={`notice notice--${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button className="btn btn--icon" aria-label="Cerrar" onClick={dismissNotice}>
            ×
          </button>
        </div>
      )}

      {/* Ancho: lo vital | rasgos, descansos y registro | recursos. Mediano: dos columnas. Estrecho: una columna. */}
      <div className="combat">
        <aside className="combat__side" aria-label="Estado del turno">
          <RestPrompts character={character} />
          <DeathSavesPanel character={character} />

          <button
            className="btn btn--primary btn--big next-turn"
            onClick={() => apply(`Empieza la ronda ${character.turn.round + 1}`, startTurn)}
          >
            Nuevo turno → <kbd>N</kbd>
          </button>

          <HpPanel character={character} />
          <TurnPanel character={character} />
          <EffectsPanel character={character} />
        </aside>

        <div className="combat__main">
          <FeatureList character={character} />
        </div>

        <div className="combat__extra">
          <ResourceList character={character} />
          <AdvantagesPanel character={character} onEdit={onEdit} />
        </div>

        <div className="combat__footer">
          <RestPanel character={character} />

          <section className="card">
            <h2>Registro</h2>
            {log.length === 0 ? (
              <p className="muted">Aquí aparecerá lo que vayas haciendo.</p>
            ) : (
              <ol className="log">
                {log.map((e) => (
                  <li key={e.id}>
                    <span className="log__round">R{e.round}</span> {e.text}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <NotesPanel character={character} />
        </div>
      </div>
    </main>
  )
}
