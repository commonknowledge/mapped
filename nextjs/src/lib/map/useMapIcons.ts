'use client'

import { useEffect, useState } from 'react'

import { MapLoader, MapboxImageSource } from '.'

export function useMapIcons(
  requiredImages: MapboxImageSource[],
  mapbox: MapLoader
) {
  const [loadedImages, setLoadedImages] = useState<string[]>([])
  useEffect(
    function loadIcons() {
      if (!mapbox.loadedMap) return
      requiredImages.forEach((requiredImage) => {
        console.log('Loading', requiredImage.url())
        // Load an image from an external URL.
        mapbox.loadedMap!.loadImage(requiredImage.url(), (error, image) => {
          try {
            if (error) throw error
            if (!image) throw new Error('Marker icon did not load')
            mapbox.loadedMap!.addImage(requiredImage.name, image)
            setLoadedImages((loadedImages) => [
              ...loadedImages,
              requiredImage.name,
            ])
          } catch (e) {
            console.error('Failed to load image', e)
          }
        })
      })
    },
    [mapbox.loadedMap, setLoadedImages]
  )
  return loadedImages
}
