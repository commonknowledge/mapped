import { gql } from '@apollo/client'

export const GET_PAGE = gql`
  query GetPage($hostname: String!, $path: String) {
    hubPageByPath(hostname: $hostname, path: $path) {
      id
      title
      path
      puckJsonContent
      seoTitle
      searchDescription
      hub {
        faviconUrl
        seoTitle
        seoImageUrl
        searchDescription
        primaryColour
        secondaryColour
        customCss
        navLinks {
          link
          label
        }
      }
    }
  }
`
