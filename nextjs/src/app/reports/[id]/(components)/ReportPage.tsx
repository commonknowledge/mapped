'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import { getPoliticalTilesetsByCountry } from '../politicalTilesets'
import { ConstituenciesPanel } from './ConstituenciesPanel'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'
import { useReport } from './ReportProvider'

export const PLACEHOLDER_LAYER_ID_CHOROPLETH = 'choropleths'
export const PLACEHOLDER_LAYER_ID_MARKERS = 'markers'

export default function ReportPage() {
  const { report } = useReport()

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <LocalisedMap
          showStreetDetails={report.displayOptions?.display?.showStreetDetails}
          initViewCountry="uk"
          mapKey={report.id}
        >
          <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_CHOROPLETH} />
          {getPoliticalTilesetsByCountry('uk').map(
            ({ boundaryType, tileset }) => (
              <PoliticalChoropleths
                key={`${boundaryType}-${tileset.mapboxSourceId}`}
                report={report}
                boundaryType={boundaryType}
                tileset={tileset}
              />
            )
          )}
          <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
          <ReportMapMarkers />
        </LocalisedMap>
      </div>
      <aside className="absolute top-0 right-0 p-5 w-[400px] h-full">
        <ConstituenciesPanel />
      </aside>
    </div>
  )
}
