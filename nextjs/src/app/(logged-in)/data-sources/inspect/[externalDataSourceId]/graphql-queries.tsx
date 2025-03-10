'use client'
import { gql } from '@apollo/client'

export const DELETE_UPDATE_CONFIG = gql`
  mutation DeleteUpdateConfig($id: String!) {
    deleteExternalDataSource(data: { id: $id }) {
      id
    }
  }
`

export const GET_UPDATE_CONFIG = gql`
  query ExternalDataSourceInspectPage($ID: ID!) {
    externalDataSource(id: $ID) {
      id
      name
      dataType
      remoteUrl
      crmType
      connectionDetails {
        ... on AirtableSource {
          apiKey
          baseId
          tableId
        }
        ... on MailchimpSource {
          apiKey
          listId
        }
        ... on ActionNetworkSource {
          apiKey
          groupSlug
        }
        ... on TicketTailorSource {
          apiKey
        }
      }
      lastImportJob {
        id
        lastEventAt
        status
      }
      lastUpdateJob {
        id
        lastEventAt
        status
      }
      autoImportEnabled
      autoUpdateEnabled
      hasWebhooks
      allowUpdates
      automatedWebhooks
      webhookUrl
      webhookHealthcheck
      geographyColumn
      geographyColumnType
      geocodingConfig
      usesValidGeocodingConfig
      postcodeField
      firstNameField
      lastNameField
      fullNameField
      emailField
      phoneField
      addressField
      titleField
      descriptionField
      imageField
      startTimeField
      endTimeField
      publicUrlField
      socialUrlField
      canDisplayPointField
      isImportScheduled
      importProgress {
        id
        hasForecast
        status
        total
        succeeded
        estimatedFinishTime
        actualFinishTime
        inQueue
        numberOfJobsAheadInQueue
        sendEmail
      }
      isUpdateScheduled
      updateProgress {
        id
        hasForecast
        status
        total
        succeeded
        estimatedFinishTime
        actualFinishTime
        inQueue
        numberOfJobsAheadInQueue
        sendEmail
      }
      importedDataCount
      importedDataGeocodingRate
      regionCount: importedDataCountOfAreas(
        analyticalAreaType: european_electoral_region
      )
      constituencyCount: importedDataCountOfAreas(
        analyticalAreaType: parliamentary_constituency
      )
      ladCount: importedDataCountOfAreas(analyticalAreaType: admin_district)
      wardCount: importedDataCountOfAreas(analyticalAreaType: admin_ward)
      fieldDefinitions(refreshFromSource: true) {
        label
        value
        description
        editable
      }
      updateMapping {
        source
        sourcePath
        destinationColumn
      }
      sharingPermissions {
        id
      }
      organisation {
        id
        name
      }
    }
  }
`
