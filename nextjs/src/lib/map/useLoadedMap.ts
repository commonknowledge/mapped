'use client'

import { useAtom } from 'jotai'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl'

import { mapHasLoaded } from './state'

export const MAPBOX_LOAD_INTERVAL = 100

export function useLoadedMap() {
  const [loaded, setLoaded] = useAtom(mapHasLoaded)
  const map = useMap()

  // Listen for when the map is ready to use, then set loaded: true
  // This prevents errors caused by adding layers to the map before it is ready
  useEffect(() => {
    if (!map.default) {
      return
    }

    const updateLoaded = () => {
      if (map.default?.isStyleLoaded()) {
        setLoaded(true)
      }
    }

    const onLoad = () => {
      if (!loaded) {
        updateLoaded()
      }
    }

    const onStyleLoad = () => {
      if (!loaded) {
        updateLoaded()
      }
    }

    // Handle style changes after the initial map load.
    // Using an interval is necessary, as isStyleLoaded()
    // returns false when the `load` and `style.load` events
    // fire after changing a style (it works correctly for the
    // initial map load). This causes an error if the map is
    // used at that point.
    const onStyleDataLoading = () => {
      setLoaded(false)
      const intervalId = setInterval((): void => {
        if (!loaded) {
          if (map.default?.isStyleLoaded()) {
            setLoaded(true)
            clearInterval(intervalId)
          }
        }
      }, MAPBOX_LOAD_INTERVAL)
    }

    map.default.on('load', onLoad)
    map.default.on('style.load', onStyleLoad)
    map.default.on('styledataloading', onStyleDataLoading)

    return () => {
      map.default?.off('load', onLoad)
      map.default?.off('style.load', onStyleLoad)
      map.default?.off('styledataloading', onStyleDataLoading)
    }
  }, [map, setLoaded, loaded])

  function getImageDataURL() {
    // Implementation informed by https://github.com/mapbox/mapbox-gl-js/issues/2766
    return new Promise<string>(function (resolve, reject) {
      if (!map.default) return reject('Map not loaded')
      map.default.once('render', function () {
        if (!map.default) return reject('Map not loaded')
        resolve(map.default.getCanvas().toDataURL())
      })
      /* trigger render */
      map.default.triggerRepaint()
    })
  }

  function getImageFile(nameWithoutExtension: string = 'map') {
    return new Promise<File>((resolve, reject) => {
      if (!map.default) return reject('Map not loaded')
      map.default.once('render', function () {
        if (!map.default) return reject('Map not loaded')
        const canvas = map.default.getCanvas()
        canvas.toBlob((blob) => {
          if (!blob) return reject('No blob')
          let file = new File([blob], `${nameWithoutExtension}.jpeg`, {
            type: 'image/jpeg',
          })
          resolve(file)
        }, 'image/jpeg')
      })
      /* trigger render */
      map.default.triggerRepaint()
    })
  }

  function downloadScreenshot(
    name: string = `mapped-${new Date().toISOString()}`
  ) {
    getImageDataURL().then((dataURL) => {
      const a = document.createElement('a')
      a.href = dataURL
      a.download = `${name}.png`
      a.click()
      a.remove()
    })
  }

  // Handle subsequent map loads
  return {
    ...map,
    defaultMap: map.default,
    currentMap: map.current,
    loadedMap: loaded ? map.default || map.current : null,
    loaded,
    getImageDataURL,
    getImageFile,
    downloadScreenshot,
  }
}
