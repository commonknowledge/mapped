import { gql } from "@apollo/client"

export const GET_HUB_MAP_DATA = gql`
  query GetHubMapData($hostname: String!) {
    hubByHostname(hostname: $hostname) {
      id
      organisation {
        id
        slug
        name
      }
      layers {
        id
        name
        type
        visible
        iconImage
        popup
        source {
          id
          dataType
        }
        mapboxPaint
        mapboxLayout
        mapboxType
      }
      navLinks {
        label
        link
      }
    }
  }
`


export const EVENT_FRAGMENT = gql`
  fragment EventFragment on GenericData {
    id
    title
    address
    postcode
    startTime
    publicUrl
    description
    dataType {
      id
      dataSet {
        externalDataSource {
          dataType
        }
      }
    }
  }
`

export const CONSTITUENCY_VIEW_FRAGMENT = gql`
  fragment ConstituencyViewFragment on Area {
    id
    gss
    name
    # For zooming
    fitBounds
    # For loudspeek
    samplePostcode {
      postcode
    }
    mp: person(filters:{personType:"MP"}) {
      id
      name
      photo {
        url
      }
      party: personDatum(filters:{
        dataType_Name: "party"
      }) {
        name: data
        shade
      }
      email: personDatum(filters:{
        dataType_Name: "email"
      }) {
        data
      }
    }
    # PPCs
    ppcs: people(filters:{personType:"PPC"}) {
      id
      name
      photo {
        url
      }
      party: personDatum(filters:{
        dataType_Name: "party"
      }) {
        name: data
        shade
      }
      email: personDatum(filters:{
        dataType_Name: "email"
      }) {
        data
      }
    }
  }
`

export const GET_LOCAL_DATA = gql`
  query GetLocalData($postcode: String!, $hostname: String!) {
    postcodeSearch(postcode: $postcode) {
      postcode
      constituency: constituency2024 {
        ...ConstituencyViewFragment
        # List of events
        genericDataForHub(hostname: $hostname) {
          ...EventFragment
        }
      }
    }
  }
  ${CONSTITUENCY_VIEW_FRAGMENT}
  ${EVENT_FRAGMENT}
`

export const GET_EVENT_DATA = gql`
  query GetEventData($eventId: String!, $hostname: String!) {
    importedDataGeojsonPoint(genericDataId: $eventId) {
      properties {
        ... EventFragment
        constituency: area(areaType: "WMC23") {
          ... ConstituencyViewFragment
          # List of events
          genericDataForHub(hostname: $hostname) {
            ...EventFragment
          }
        }
      }
    }
  }
  ${CONSTITUENCY_VIEW_FRAGMENT}
  ${EVENT_FRAGMENT}
`