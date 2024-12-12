'use client'
import { isConstituencyPanelOpenAtom, useLoadedMap } from '@/lib/map'
import { atom, useAtom, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { Tileset } from './types'

export const selectedBoundaryAtom = atom<string | null>(null)

const useClickOnBoundaryEvents = (tileset?: Tileset | null) => {
  const { loadedMap } = useLoadedMap()
  const [selectedBoundary, setSelectedBoundary] = useAtom(selectedBoundaryAtom)
  const setIsConstituencyPanelOpen = useSetAtom(isConstituencyPanelOpenAtom)

  useEffect(
    function selectConstituency() {
      if (!tileset || !loadedMap) return
      loadedMap?.on('mouseover', `${tileset.mapboxSourceId}-fill`, () => {
        const canvas = loadedMap?.getCanvas()
        if (!canvas) return
        canvas.style.cursor = 'pointer'
      })
      loadedMap?.on('mouseleave', `${tileset.mapboxSourceId}-fill`, () => {
        const canvas = loadedMap?.getCanvas()
        if (!canvas) return
        canvas.style.cursor = ''
      })
      loadedMap?.on('click', `${tileset.mapboxSourceId}-fill`, (event: any) => {
        try {
          const feature = event.features?.[0]
          if (feature) {
            if (feature.source === tileset.mapboxSourceId) {
              const id = feature.properties?.[tileset.promoteId]
              if (id) {
                // If already selected boundary, deselect it
                if (selectedBoundary === id) {
                  setSelectedBoundary(null)
                  setIsConstituencyPanelOpen(false)
                  return
                } else {
                  setSelectedBoundary(id)
                  setIsConstituencyPanelOpen(true)
                }
              }
            }
          }
        } catch (e) {
          console.error('Failed to select constituency', e)
        }
      })
    },
    [
      loadedMap,
      tileset,
      selectedBoundary,
      setSelectedBoundary,
      setIsConstituencyPanelOpen,
    ]
  )
}

export default useClickOnBoundaryEvents
