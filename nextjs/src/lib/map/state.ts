import { atom } from 'jotai'
import { MapboxGeoJSONFeature } from 'mapbox-gl'

export const mapHasLoaded = atom(false)
export const isDataConfigOpenAtom = atom(false)
export const isConstituencyPanelOpenAtom = atom(false)
export const selectedSourceMarkerAtom = atom<MapboxGeoJSONFeature | null>(null)
export const constituencyPanelTabAtom = atom('list')
export const selectedConstituencyAtom = atom<string | null>(null)
