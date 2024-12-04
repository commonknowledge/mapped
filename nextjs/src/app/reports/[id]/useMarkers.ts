import { useLoadedMap, useMapIcons } from '@/lib/map'

const useMarkers = () => {
  const mapbox = useLoadedMap()
  const requiredImages = [
    {
      url: () =>
        new URL('/markers/default.png', window.location.href).toString(),
      name: 'meep-marker-0',
    },
    {
      url: () =>
        new URL('/markers/default-2.png', window.location.href).toString(),
      name: 'meep-marker-1',
    },
    {
      url: () =>
        new URL('/markers/selected.png', window.location.href).toString(),
      name: 'meep-marker-selected',
    },
  ]

  useMapIcons(requiredImages, mapbox)

  return null
}

export default useMarkers
