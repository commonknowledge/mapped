'use client'

import { gql } from '@apollo/client'

import { MAP_REPORT_FRAGMENT } from '@/lib/map'

//  TODO: In general, make these query names more consistent with their actual function and return data
// for example, "_STATS" is ambiguous now that we're moving into the phase
// of not just returning row counts for every geographic query.
// Also, "MAP_REPORT" is redundant, since the queries take a report ID as an argument.
// These should be replaced by e.g. DATA_SOURCE_ROW_COUNT_BY_WARD

export const MAP_REPORT_WARD_STATS = gql`
  query MapReportWardStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByArea(
        analyticalAreaType: admin_ward
        sumColumn: "Observation"
      ) {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

export const MAP_REPORT_LAYER_POINT = gql`
  query MapReportLayerGeoJSONPoint($genericDataId: String!) {
    importedDataGeojsonPoint(genericDataId: $genericDataId) {
      id
      type
      geometry {
        type
        coordinates
      }
      properties {
        id
        lastUpdate
        name
        phone
        email
        postcodeData {
          postcode
        }
        address
        json
        remoteUrl
        dataType {
          dataSet {
            externalDataSource {
              name
            }
          }
        }
      }
    }
  }
`

export const MAP_REPORT_LAYER_ANALYTICS = gql`
  query MapReportLayerAnalytics($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      layers {
        id
        name
        source {
          id
          dataType
          organisation {
            name
          }
        }
      }
    }
  }
`
export const MAP_REPORT_REGION_STATS = gql`
  query MapReportRegionStats($reportID: ID!) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByRegion {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`
export const MAP_REPORT_CONSTITUENCY_STATS = gql`
  query MapReportConstituencyStats(
    $reportID: ID!
    $analyticalAreaType: AnalyticalAreaType!
  ) {
    mapReport(pk: $reportID) {
      id
      importedDataCountByConstituency: importedDataCountByArea(
        analyticalAreaType: $analyticalAreaType
      ) {
        label
        gss
        count
        gssArea {
          point {
            id
            type
            geometry {
              type
              coordinates
            }
          }
        }
      }
    }
  }
`

export const GET_MAP_REPORT = gql`
  query GetMapReport($id: ID!) {
    mapReport(pk: $id) {
      id
      name
      slug
      displayOptions
      organisation {
        id
        slug
        name
      }
      ...MapReportPage
    }
  }
  ${MAP_REPORT_FRAGMENT}
`

// Keep this fragment trim
// so that updates return fast
export const UPDATE_MAP_REPORT = gql`
  mutation UpdateMapReport($input: MapReportInput!) {
    updateMapReport(data: $input) {
      id
      name
      displayOptions
      layers {
        id
        name
        source {
          id
          name
        }
      }
    }
  }
`

export const DELETE_MAP_REPORT = gql`
  mutation DeleteMapReport($id: IDObject!) {
    deleteMapReport(data: $id) {
      id
    }
  }
`
