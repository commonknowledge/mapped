export function globalID(obj: { id: string; __typename: string }) {
  return btoa(`${obj.__typename}:${obj.id}`)
}
