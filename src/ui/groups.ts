export const DEFAULT_GROUP = 'General'

/** Agrupa por `group` respetando el orden en que aparece cada grupo por primera vez. */
export function groupItems<T extends { group?: string }>(items: T[]): { name: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const name = item.group?.trim() || DEFAULT_GROUP
    const list = map.get(name)
    if (list) list.push(item)
    else map.set(name, [item])
  }
  return [...map].map(([name, items]) => ({ name, items }))
}

/** Compara sin mayúsculas ni tildes: "accion" encuentra "Acción". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
