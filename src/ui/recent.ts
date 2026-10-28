/** Añade un valor al principio de la lista de recientes, sin repetir y con un máximo. */
export function pushRecent(list: number[], value: number, max = 4): number[] {
  return [value, ...list.filter((v) => v !== value)].slice(0, max)
}
