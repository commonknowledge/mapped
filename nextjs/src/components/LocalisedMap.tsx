import { BACKEND_URL } from '@/env'
import { authenticationHeaders } from '@/lib/auth'
import { RequestTransformFunction } from 'mapbox-gl'
import React from 'react'
import Map from 'react-map-gl'

interface LocalisedMapProps {
  children?: React.ReactNode
  showStreetDetails?: boolean
  initViewCountry?: keyof typeof INITIAL_VIEW_STATES
  mapKey?: string
}

const INITIAL_VIEW_STATES = {
  uk: {
    longitude: -2.296605,
    latitude: 53.593349,
    zoom: 6,
  },
}

const LocalisedMap: React.FC<LocalisedMapProps> = ({
  children,
  showStreetDetails,
  initViewCountry = 'uk',
  mapKey,
}) => {
  return (
    <Map
      key={mapKey || Math.random().toString()}
      initialViewState={{
        ...INITIAL_VIEW_STATES[initViewCountry],
      }}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
      mapStyle={
        showStreetDetails
          ? 'mapbox://styles/commonknowledge/clubx087l014y01mj1bv63yg8'
          : 'mapbox://styles/commonknowledge/cm4cjnvff01mx01sdcmpbfuz5'
      }
      transformRequest={mapboxTransformRequest}
    >
      {children}
    </Map>
  )
}

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
