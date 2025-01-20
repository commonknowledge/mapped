'use client'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { layerEditorStateAtom } from '@/lib/map'
import { useAtom } from 'jotai'
import { PencilIcon } from 'lucide-react'
import React from 'react'
import { DEFAULT_MARKER_COLOUR } from './MembersListPointMarkers'
import { useReport } from './ReportProvider'

const DataSourcesList: React.FC = () => {
  const { report } = useReport()
  const [layerEditorState, setLayerEditorState] = useAtom(layerEditorStateAtom)

  return (
    <>
      <div className="flex flex-col gap-0">
        {report.layers.map(
          (layer, index) =>
            layer?.sourceData && (
              <div
                key={layer?.sourceData.id || index}
                className="flex gap-0 items-center"
              >
                <Button
                  className="bg-transparent hover:bg-meepGray-800 text-sm flex flex-row items-center gap-0 text-left 
                  justify-start overflow-hidden text-nowrap text-ellipsis h-11 w-full -ml-2"
                  style={{
                    borderColor:
                      layer.mapboxPaint?.['circle-color'] ||
                      DEFAULT_MARKER_COLOUR,
                  }}
                  onClick={() => {
                    if (
                      layerEditorState.open &&
                      layerEditorState.layerId === layer?.id
                    ) {
                      setLayerEditorState({ open: false })
                    } else if (layer.id) {
                      setLayerEditorState({
                        open: true,
                        layerId: layer.id,
                      })
                    }
                  }}
                >
                  <CRMSelection
                    // @ts-ignore: Property 'id' is optional in type 'DeepPartialObject - a silly Fragment typing
                    source={layer.sourceData}
                    isShared={!!layer.sharingPermission}
                  />
                  <PencilIcon className="ml-auto w-4 h-4 text-meepGray-400" />
                </Button>
              </div>
            )
        )}
      </div>
    </>
  )
}

export default DataSourcesList
