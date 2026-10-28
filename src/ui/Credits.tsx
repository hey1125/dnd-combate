import { useState } from 'react'

const LIBS = [
  { name: 'React', url: 'https://react.dev' },
  { name: 'Vite', url: 'https://vite.dev' },
  { name: 'TypeScript', url: 'https://www.typescriptlang.org' },
  { name: 'Zustand', url: 'https://zustand.docs.pmnd.rs' },
  { name: 'Dexie.js', url: 'https://dexie.org' },
  { name: 'Zod', url: 'https://zod.dev' },
]

/** Pestaña pequeña al pie de la página que despliega los créditos. */
export function Credits() {
  const [open, setOpen] = useState(false)

  return (
    <footer className="credits">
      {open && (
        <section className="card credits__panel" id="credits-panel">
          <h2>Créditos</h2>
          <p>
            <strong>Combate D&amp;D</strong>, gestor de recursos para personajes de D&amp;D 5e. Hecho por <strong>Daniel</strong>, con
            ayuda de Claude (Anthropic).
          </p>
          <p>
            Las reglas de los estados (Derribado, Envenenado…) son un resumen basado en el{' '}
            <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noreferrer">
              System Reference Document 5.1
            </a>{' '}
            de Wizards of the Coast LLC, publicado bajo licencia{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noreferrer">
              CC BY 4.0
            </a>
            .
          </p>
          <p>
            Hecho con{' '}
            {LIBS.map((l, i) => (
              <span key={l.name}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.name}
                </a>
                {i < LIBS.length - 2 ? ', ' : i === LIBS.length - 2 ? ' y ' : '.'}
              </span>
            ))}
          </p>
          <p className="muted credits__legal">
            Proyecto de fans sin fines de lucro. No está afiliado ni respaldado por Wizards of the Coast ni por Nivel20. Dungeons &amp;
            Dragons y D&amp;D son marcas de Wizards of the Coast LLC.
          </p>
        </section>
      )}
      <button className="credits__tab" aria-expanded={open} aria-controls="credits-panel" onClick={() => setOpen((o) => !o)}>
        {open ? 'Cerrar créditos ▾' : 'Créditos ▴'}
      </button>
    </footer>
  )
}
