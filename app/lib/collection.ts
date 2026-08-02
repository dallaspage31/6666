export function findById<T extends { id: string }>(collection: readonly T[], id: string): T | undefined {
  return collection.find((entry) => entry.id === id)
}

export function filterBy<T, K extends keyof T>(collection: readonly T[], key: K, value: T[K]): T[] {
  return collection.filter((entry) => entry[key] === value)
}
