import { gql } from '@apollo/client'

export const UPDATE_EXTERNAL_DATA_SOURCE = gql`
  mutation UpdateExternalDataSource($input: ExternalDataSourceInput!) {
    updateExternalDataSource(input: $input) {
      id
      name
      geographyColumn
      geographyColumnType
      postcodeField
      firstNameField
      lastNameField
      emailField
      phoneField
      addressField
      canDisplayPointField
      autoImportEnabled
      autoUpdateEnabled
      updateMapping {
        source
        sourcePath
        destinationColumn
      }
    }
  }
`
