import { useEffect, useState } from 'react'
import { dexieRepository } from './data/dexieRepository'
import { useCombat } from './store/combatStore'
import { CharacterEditor } from './ui/CharacterEditor'
import { CharacterList } from './ui/CharacterList'
import { CombatScreen } from './ui/CombatScreen'

type View = { name: 'combat' } | { name: 'list' } | { name: 'edit'; id: string | null }

export default function App() {
  const loaded = useCombat((s) => s.loaded)
  const active = useCombat((s) => s.character)
  const characters = useCombat((s) => s.characters)
  const { init, select, saveCharacter } = useCombat.getState()
  const [view, setView] = useState<View>({ name: 'combat' })

  useEffect(() => {
    init(dexieRepository)
  }, [init])

  // Cambiar de pantalla siempre empieza arriba.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  if (!loaded) return <p className="loading">Cargando…</p>

  if (view.name === 'edit') {
    const editing = view.id ? (characters.find((c) => c.id === view.id) ?? null) : null
    return (
      <CharacterEditor
        key={view.id ?? 'new'}
        character={editing}
        onCancel={() => setView(active ? { name: 'combat' } : { name: 'list' })}
        onSave={async (c) => {
          await saveCharacter(c)
          select(c.id)
          setView({ name: 'combat' })
        }}
      />
    )
  }

  if (view.name === 'list' || !active) {
    return (
      <CharacterList
        onPlay={(id) => {
          select(id)
          setView({ name: 'combat' })
        }}
        onEdit={(id) => setView({ name: 'edit', id })}
      />
    )
  }

  return <CombatScreen onOpenList={() => setView({ name: 'list' })} onEdit={() => setView({ name: 'edit', id: active.id })} />
}
