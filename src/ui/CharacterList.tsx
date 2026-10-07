import { useState } from 'react'
import { useCombat } from '../store/combatStore'

type Props = {
  onPlay: (id: string) => void
  onEdit: (id: string | null) => void
}

export function CharacterList({ onPlay, onEdit }: Props) {
  const characters = useCombat((s) => s.characters)
  const activeId = useCombat((s) => s.character?.id)
  const { deleteCharacter, addExample } = useCombat.getState()
  const [confirming, setConfirming] = useState<string | null>(null)

  return (
    <main className="app">
      <header className="top">
        <h1>Personajes</h1>
        <button className="btn btn--primary btn--small" onClick={() => onEdit(null)}>
          + Nuevo
        </button>
      </header>

      {characters.length === 0 && (
        <section className="card">
          <p className="muted">Todavía no tienes personajes.</p>
        </section>
      )}

      {characters.map((c) => (
        <section key={c.id} className={`card char ${c.id === activeId ? 'char--active' : ''}`}>
          <div className="char__info">
            <strong>{c.name}</strong>
            <span className="muted">
              Nivel {c.level} · PG {c.hp.current}/{c.hp.max} · {c.resources.length} recursos · {c.features.length} rasgos
            </span>
          </div>
          {confirming === c.id ? (
            <div className="row">
              <span className="muted">¿Borrar {c.name}?</span>
              <button className="btn btn--small btn--danger" onClick={() => deleteCharacter(c.id).then(() => setConfirming(null))}>
                Sí, borrar
              </button>
              <button className="btn btn--small" onClick={() => setConfirming(null)}>
                No
              </button>
            </div>
          ) : (
            <div className="row">
              <button className="btn btn--primary" onClick={() => onPlay(c.id)}>
                Jugar
              </button>
              <button className="btn" onClick={() => onEdit(c.id)}>
                Editar
              </button>
              <button className="btn btn--ghost-danger" onClick={() => setConfirming(c.id)}>
                Borrar
              </button>
            </div>
          )}
        </section>
      ))}

      <footer className="footer">
        <button className="btn btn--link" onClick={addExample}>
          Agregar Guerrero de ejemplo
        </button>
      </footer>
    </main>
  )
}
