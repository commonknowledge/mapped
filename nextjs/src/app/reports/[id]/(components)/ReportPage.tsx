'use client'

import LocalisedMap from '@/components/LocalisedMap'
import { PlaceholderLayer } from '@/components/PlaceholderLayer'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapIcon } from 'lucide-react'
import { useRef } from 'react'
import { MapRef } from 'react-map-gl'
import ReportDashboard from '../dashboard/ReportDashboard'
import PoliticalChoropleths from './MapLayers/PoliticalChoropleths'
import ReportMapMarkers from './MapLayers/ReportMapMarkers'
import ReportHexMap from './ReportHexMap'
import { useReport } from './ReportProvider'
import { ReportSidebarLeft } from './ReportSidebarLeft'

export const PLACEHOLDER_LAYER_ID_CHOROPLETH = 'choropleths'
export const PLACEHOLDER_LAYER_ID_MARKERS = 'markers'

export default function ReportPage() {
  const mapRef = useRef<MapRef>(null)
  const { report } = useReport()
  const boundaryType = report.displayOptions?.dataVisualisation?.boundaryType
  const tileset = report.politicalBoundaries.find(
    (boundary) => boundary.boundaryType === boundaryType
  )?.tileset

  // Handle panel resize
  const handlePanelResize = () => {
    if (mapRef.current) {
      // Force map resize after panel animation completes
      setTimeout(() => {
        mapRef.current?.resize()
      }, 10) // matches transition duration
    }
  }

  return (
    <div className="absolute w-[-webkit-fill-available] h-full flex flex-row pointer-events-none">
      <div className="w-full h-full pointer-events-auto">
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={handlePanelResize}
        >
          <ReportSidebarLeft />
          <ResizablePanel className="min-w-[300px]">
            <div className="relative w-full h-full transition-all duration-300">
              <Tabs defaultValue="map" className="w-full h-full ">
                <TabsList className="absolute top-[15px] left-[15px] z-10 ">
                  <MapIcon className="w-4 h-4 mx-2 stroke-meepGray-400" />
                  <TabsTrigger value="map" className="">
                    GEO
                  </TabsTrigger>
                  <TabsTrigger value="hex">HEX</TabsTrigger>
                </TabsList>
                <TabsContent value="map" className="w-full h-full mt-0">
                  <LocalisedMap
                    ref={mapRef}
                    showStreetDetails={
                      report.displayOptions?.display?.showStreetDetails
                    }
                    initViewCountry="uk"
                    mapKey={report.id}
                  >
                    <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_CHOROPLETH} />
                    {/* We load and populate all available political boundaries first, then toggle their visibility later.
          This prevents re-rendering and re-initialisting the layers and re-calculating stats when a user
          just wants to change the visible boundary type */}
                    {/* {report.politicalBoundaries.map(({ boundaryType, tileset }) => ( */}
                    {tileset && boundaryType && (
                      <PoliticalChoropleths
                        key={`${boundaryType}-${tileset.mapboxSourceId}`}
                        report={report}
                        boundaryType={boundaryType}
                        tileset={tileset}
                      />
                    )}
                    {/* ))} */}
                    <PlaceholderLayer id={PLACEHOLDER_LAYER_ID_MARKERS} />
                    <ReportMapMarkers />
                  </LocalisedMap>
                </TabsContent>
                <TabsContent value="hex" className="w-full h-full mt-0">
                  <ReportHexMap />
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle={true} />
          <ResizablePanel className="min-w-[300px]">
            <ReportDashboard />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}
