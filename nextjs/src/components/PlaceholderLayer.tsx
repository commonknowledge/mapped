'use client'

import { Layer, LayerProps } from 'react-map-gl'

/**
 * Placeholder layer to refer to in `beforeId`.
 * See https://github.com/visgl/react-map-gl/issues/939#issuecomment-625290200
 */

export function PlaceholderLayer(
  props: Partial<Omit<LayerProps, 'filter' | 'source' | 'source-layer'>>
) {
  return (
    <Layer
      {...props}
      type="background"
      layout={{ visibility: 'none' }}
      paint={{}}
    />
  )
}
