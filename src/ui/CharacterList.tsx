import { useRef, useState } from 'react'
import { exportCharacters, mergeCharacter, parseImport } from '../core/io'
import type { Character } from '../core/types'
import { useCombat } from '../store/combatStore'

/** Descarga un archivo JSON con los personajes dados. */
function download(characters: Character[], filename: string) {
  const blob = new Blob([exportCharacters(characters)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'personaje'

type Props = {
  onPlay: (id: string) => void
  onEdit: (id: string | null) => void
}

export function CharacterList({ onPlay, onEdit }: Props) {
  const characters = useCombat((s) => s.characters)
  const activeId = useCombat((s) => s.character?.id)
  const notice = useCombat((s) => s.notice)
  const { deleteCharacter, addExample, importCharacters, dismissNotice } = useCombat.getState()
  const [confirming, setConfirming] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  // Importación esperando que elijas qué hacer con los personajes que ya existen.
  const [pending, setPending] = useState<{ characters: Character[]; skipped: string[] } | null>(null)

  const existing = new Map(characters.map((c) => [c.id, c]))
  const repeated = pending ? pending.characters.filter((c) => existing.has(c.id)) : []

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const result = parseImport(await file.text())
    if (fileInput.current) fileInput.current.value = ''
    if (!result.ok) return useCombat.setState({ notice: { kind: 'error', text: result.error } })
    // Si alguno ya existe, pregunta; si no, importa directo.
    if (result.characters.some((c) => existing.has(c.id))) setPending(result)
    else await importCharacters(result.characters, result.skipped)
  }

  const finishImport = async (mode: 'update' | 'replace') => {
    if (!pending) return
    const list =
      mode === 'update'
        ? pending.characters.map((c) => {
            const old = existing.get(c.id)
            return old ? mergeCharacter(old, c) : c
          })
        : pending.characters
    setPending(null)
    await importCharacters(list, pending.skipped)
  }

  return (
    <main className="app">
      <header className="top">
        <h1>Personajes</h1>
        <button className="btn btn--primary btn--small" onClick={() => onEdit(null)}>
          + Nuevo
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
              <button className="btn" onClick={() => download([c], `${slug(c.name)}.json`)}>
                Exportar
              </button>
              <button className="btn btn--ghost-danger" onClick={() => setConfirming(c.id)}>
                Borrar
              </button>
            </div>
          )}
        </section>
      ))}

      <section className="card">
        <h2>Respaldo</h2>
        <div className="row">
          <button
            className="btn"
            disabled={characters.length === 0}
            onClick={() => download(characters, `dnd-combate-${new Date().toISOString().slice(0, 10)}.json`)}
          >
            Exportar todos
          </button>
          <button className="btn" onClick={() => fileInput.current?.click()}>
            Importar archivo…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
        {pending ? (
          <div className="import-choice" role="group" aria-label="Qué hacer con los personajes que ya existen">
            <p className="import-choice__text">
              {repeated.length === 1 ? (
                <>
                  <strong>{repeated[0].name}</strong> ya existe.
                </>
              ) : (
                <>
                  {repeated.length} personajes ya existen: <strong>{repeated.map((c) => c.name).join(', ')}</strong>.
                </>
              )}{' '}
              ¿Qué hago con {repeated.length === 1 ? 'él' : 'ellos'}?
            </p>
            <div className="row">
              <button className="btn btn--primary" onClick={() => finishImport('update')}>
                Actualizar ficha
              </button>
              <button className="btn" onClick={() => finishImport('replace')}>
                Reemplazar todo
              </button>
              <button className="btn btn--link" onClick={() => setPending(null)}>
                Cancelar
              </button>
            </div>
            <p className="hint">
              <strong>Actualizar ficha</strong> trae los rasgos, recursos y máximos nuevos, pero conserva tus PG, usos gastados, estados y
              ronda. <strong>Reemplazar todo</strong> deja el personaje tal como viene en el archivo (todo recargado).
            </p>
          </div>
        ) : (
          <p className="hint">Si importas un personaje que ya existe, podrás elegir entre actualizar su ficha o reemplazarlo.</p>
        )}
      </section>

      <footer className="footer">
        <button className="btn btn--link" onClick={addExample}>
          Agregar Guerrero de ejemplo
        </button>
      </footer>
    </main>
  )
}
