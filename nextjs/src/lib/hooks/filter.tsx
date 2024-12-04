import Fuse, { IFuseOptions } from 'fuse.js'
import * as React from 'react'

/**
 * A React Hook that filters an array using the Fuse.js fuzzy-search library.
 *
 * @param list The array to filter.
 * @param searchTerm The search term to filter by.
 * @param fuseOptions Options for Fuse.js.
 *
 * @returns The filtered array.
 *
 * @see https://fusejs.io/
 */
export function useFuse<T>(
  list: T[],
  searchTerm: string,
  fuseOptions?: IFuseOptions<T>
) {
  const fuse = React.useMemo(() => {
    return new Fuse(list, fuseOptions)
  }, [list, fuseOptions])

  return React.useMemo(() => {
    if (!searchTerm) return { filteredList: list }
    const results = fuse.search(searchTerm)
    const filteredList = results.map((result) => result.item)
    return { filteredList, results }
  }, [fuse, searchTerm])
}

export default useFuse
