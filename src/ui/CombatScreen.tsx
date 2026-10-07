import { longRest, shortRest } from '../core/resources'
import { startCombat, startTurn } from '../core/turn'
import { useCombat } from '../store/combatStore'
import { DeathSavesPanel } from './DeathSavesPanel'
import { EffectsPanel } from './EffectsPanel'
import { FeatureList } from './FeatureList'
import { HpPanel } from './HpPanel'
import { ResourceList } from './ResourceList'
import { TurnPanel } from './TurnPanel'

type Props = { onOpenList: () => void; onEdit: () => void }

export function CombatScreen({ onOpenList, onEdit }: Props) {
  const character = useCombat((s) => s.character)
  const log = useCombat((s) => s.log)
  const notice = useCombat((s) => s.notice)
  const canUndo = useCombat((s) => s.history.length > 0)
  const { apply, undo, dismissNotice } = useCombat.getState()

  if (!character) return <p className="loading">Cargando…</p>

  return (
    <main className="app">
      <header className="top">
        <div>
          <h1>{character.name}</h1>
          <p className="subtitle">
            Nivel {character.level} · Ronda {character.turn.round}
          </p>
        </div>
        <div className="top__actions">
          <button className="btn btn--small" disabled={!canUndo} onClick={undo}>
            ↶ Deshacer
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

      <DeathSavesPanel character={character} />

      <button className="btn btn--primary btn--big next-turn" onClick={() => apply(`Empieza la ronda ${character.turn.round + 1}`, startTurn)}>
        Nuevo turno →
      </button>

      <div className="grid">
        <TurnPanel character={character} />
        <HpPanel character={character} />
        <FeatureList character={character} />
        <ResourceList character={character} />
        <EffectsPanel character={character} />
      </div>

      <section className="card">
        <h2>Descansos y combate</h2>
        <div className="row">
          <button className="btn" onClick={() => apply('Descanso corto', shortRest)}>
            Descanso corto
          </button>
          <button className="btn" onClick={() => apply('Descanso largo', longRest)}>
            Descanso largo
          </button>
          <button className="btn" onClick={() => apply('Nuevo combate', startCombat)}>
            Nuevo combate
          </button>
        </div>
      </section>

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

    </main>
  )
}
