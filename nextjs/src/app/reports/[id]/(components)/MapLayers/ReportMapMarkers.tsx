'use client'
import { DataSourceType } from '@/__generated__/graphql'
import useMapMarkerImages from '@/components/useMapMarkerImages'
import React from 'react'
import useMarkerAnalytics from '../../useMarkerAnalytics'
import { MembersListPointMarkers } from '../MembersListPointMarkers'

const ReportMapMarkers: React.FC = () => {
  const analytics = useMarkerAnalytics()
  useMapMarkerImages()

  // TODO: Get clarity on what the pointSourceTypes are
  const pointSourceTypes = [DataSourceType.Member, DataSourceType.Location]

  if (!analytics.data) return null
  const memberListSources = analytics.data.mapReport.layers.filter((layer) =>
    pointSourceTypes.includes(layer.source.dataType)
  )

  return (
    <div>
      {memberListSources.map((layer, index) => (
        <MembersListPointMarkers
          key={layer?.source?.id || index}
          index={index}
          externalDataSourceId={layer?.source?.id}
        />
      ))}
    </div>
  )
}

export default ReportMapMarkers
