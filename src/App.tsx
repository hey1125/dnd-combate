import { useEffect } from 'react'
import { dexieRepository } from './data/dexieRepository'
import { useCombat } from './store/combatStore'
import { CombatScreen } from './ui/CombatScreen'

export default function App() {
  const init = useCombat((s) => s.init)

  useEffect(() => {
    init(dexieRepository)
  }, [init])

  return <CombatScreen />
}
