import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import { RequestTransformFunction } from 'mapbox-gl'
import React, { forwardRef } from 'react'
import Map, { MapRef } from 'react-map-gl'

interface LocalisedMapProps {
  children?: React.ReactNode
  showStreetDetails?: boolean
  initViewCountry?: keyof typeof INITIAL_VIEW_STATES
  mapKey?: string
}

export const INITIAL_VIEW_STATES = {
  uk: {
    longitude: -2.296605,
    latitude: 53.593349,
    zoom: 6,
  },
}

const LocalisedMap = forwardRef<MapRef, LocalisedMapProps>(
  ({ children, showStreetDetails, initViewCountry = 'uk', mapKey }, ref) => {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <Map
          ref={ref}
          key={mapKey || Math.random().toString()}
          style={{ position: 'relative', width: '100%', height: '100%' }}
          initialViewState={{
            ...INITIAL_VIEW_STATES[initViewCountry],
          }}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          mapStyle={
            showStreetDetails
              ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
              : `mapbox://styles/commonknowledge/cm4cjnvff01mx01sdcmpbfuz5${process.env.NODE_ENV !== 'production' ? '/draft' : ''}`
          }
          transformRequest={mapboxTransformRequest}
        >
          {children}
        </Map>
      </div>
    )
  }
)

LocalisedMap.displayName = 'LocalisedMap'

export default LocalisedMap

const mapboxTransformRequest: RequestTransformFunction = (url) => {
  if (url.includes(BACKEND_URL) && !url.includes('tiles.json')) {
    return {
      url,
      headers: authenticationHeaders(),
      method: 'GET',
    }
  }
  return { url }
}
