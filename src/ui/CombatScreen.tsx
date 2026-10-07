import { longRest, shortRest } from '../core/resources'
import { startCombat, startTurn } from '../core/turn'
import { useCombat } from '../store/combatStore'
import { FeatureList } from './FeatureList'
import { HpPanel } from './HpPanel'
import { ResourceList } from './ResourceList'
import { TurnPanel } from './TurnPanel'

export function CombatScreen() {
  const character = useCombat((s) => s.character)
  const log = useCombat((s) => s.log)
  const notice = useCombat((s) => s.notice)
  const canUndo = useCombat((s) => s.history.length > 0)
  const { apply, undo, dismissNotice, resetToExample } = useCombat.getState()

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
        <button className="btn btn--small" disabled={!canUndo} onClick={undo}>
          ↶ Deshacer
        </button>
      </header>

      {notice && (
        <div className={`notice notice--${notice.kind}`} role="status">
          <span>{notice.text}</span>
          <button className="btn btn--icon" aria-label="Cerrar" onClick={dismissNotice}>
            ×
          </button>
        </div>
      )}

      <button className="btn btn--primary btn--big next-turn" onClick={() => apply(`Empieza la ronda ${character.turn.round + 1}`, startTurn)}>
        Nuevo turno →
      </button>

      <div className="grid">
        <TurnPanel character={character} />
        <HpPanel character={character} />
        <FeatureList character={character} />
        <ResourceList character={character} />
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

      <footer className="footer">
        <button className="btn btn--link" onClick={resetToExample}>
          Reiniciar personaje de ejemplo
        </button>
      </footer>
    </main>
  )
}
