import { gql, useMutation, useQuery } from '@apollo/client'
import { ComponentConfig, FieldLabel } from '@measured/puck'
import { useAtomValue } from 'jotai'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

import {
  AddMemberMutation,
  AddMemberMutationVariables,
  DataSourceType,
  HubListDataSourcesQuery,
  HubListDataSourcesQueryVariables,
} from '@/__generated__/graphql'
import { currentOrganisationIdAtom } from '@/lib/organisation'

export type MemberFormProps = {
  successRedirect: string
  externalDataSourceIds: string[]
}

const DataSourceSelect = ({
  value,
  onChange,
}: {
  value: string[] | undefined
  onChange: (value: string[]) => void
}) => {
  const currentOrganisationId = useAtomValue(currentOrganisationIdAtom)
  const { loading, error, data } = useQuery<
    HubListDataSourcesQuery,
    HubListDataSourcesQueryVariables
  >(HUB_LIST_DATA_SOURCES, {
    variables: { currentOrganisationId },
  })
  if (loading) {
    return <span>Loading...</span>
  }
  if (error) {
    return <span>{String(error)}</span>
  }
  const memberLists =
    data?.myOrganisations
      .flatMap((o) => o.externalDataSources)
      .filter(
        (source) =>
          source.dataType === DataSourceType.Member ||
          source.dataType === DataSourceType.Group
      ) || []
  if (!memberLists.length) {
    return (
      <span>
        No membership lists, add one <Link href="/data-sources">here</Link>.
      </span>
    )
  }
  const onChangeSelect = (selectIndex: number, selectValue: string) => {
    // Ensure value has 3 elements
    value = ['', '', ''].map((v, i) => {
      if (value && value[i]) {
        return value[i]
      }
      return v
    })
    value[selectIndex] = selectValue
    return onChange(value)
  }
  return (
    <>
      <div className="mb-3">
        <label>All Members List</label>
        <select
          className="border p-2"
          value={value ? value[0] : ''}
          onChange={(e) => onChangeSelect(0, e.target.value)}
          required
        >
          <option value="">Select Data Source</option>
          {memberLists.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Communication Consent Members List</label>
        <select
          className="border p-2"
          value={value ? value[1] : ''}
          onChange={(e) => onChangeSelect(1, e.target.value)}
        >
          <option value="">Select Data Source</option>
          {memberLists.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label>Groups List</label>
        <select
          className="border p-2"
          value={value ? value[2] : ''}
          onChange={(e) => onChangeSelect(2, e.target.value)}
          required
        >
          <option value="">Select Data Source</option>
          {memberLists.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
      </div>
    </>
  )
}

export const MemberForm: ComponentConfig<MemberFormProps> = {
  label: 'MemberForm',
  fields: {
    successRedirect: {
      type: 'text',
      label: 'Success page slug',
    },
    externalDataSourceIds: {
      type: 'custom',
      render: ({ onChange, value }) => (
        <FieldLabel label="Data Source">
          <DataSourceSelect value={value} onChange={onChange} />
        </FieldLabel>
      ),
    },
  },
  // TODO: make the form fields configurable
  render: ({ successRedirect, externalDataSourceIds }) => {
    return (
      <MemberFormComponent
        successRedirect={successRedirect}
        externalDataSourceIds={externalDataSourceIds}
      />
    )
  },
}

const MemberFormComponent = ({
  successRedirect,
  externalDataSourceIds,
}: {
  successRedirect: string
  externalDataSourceIds: string[]
}) => {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [postcode, setPostcode] = useState(
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('postcode')) ||
      ''
  )
  const [isGroup, setIsGroup] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [groupURL, setGroupURL] = useState('')
  const [groupSocial, setGroupSocial] = useState('')
  const [heardFromOrganisationName, setHeardFromOrganisationName] = useState('')
  const [communicationConsent, setCommunicationConsent] = useState(false)
  const [mapConsent, setMapConsent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [addMemberMutation] = useMutation<
    AddMemberMutation,
    AddMemberMutationVariables
  >(ADD_MEMBER)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let success = true

    const customFields = {
      FNAME: firstName,
      LNAME: lastName,
      POSTCODE: postcode,
      GROUP_NAME: groupName,
      GROUP_URL: groupURL,
      GROUP_SOCIAL: groupSocial,
      HEARD_FROM: heardFromOrganisationName,
      MAP_CONSENT: mapConsent,
    }

    // Add the member to the main members list
    const [membersList, communicationMembersList, groupList] =
      externalDataSourceIds
    const allMembersList = groupName ? groupList : membersList
    try {
      const { data } = await addMemberMutation({
        variables: {
          externalDataSourceId: allMembersList,
          email,
          postcode,
          customFields,
          tags: [],
        },
      })
      if (!data?.addMember) {
        success = false
      }

      // If extra consent given, add to extra list
      if (communicationConsent && allMembersList !== communicationMembersList) {
        const { data } = await addMemberMutation({
          variables: {
            externalDataSourceId: communicationMembersList,
            email,
            postcode,
            customFields: {
              ...customFields,
            },
            tags: ['MP-pledge-24'],
          },
        })
        if (!data?.addMember) {
          success = false
        }
      }

      if (success) {
        router.push('/' + successRedirect)
        return
      } else {
        setError('Unknown error, please try again later')
      }
    } catch (e) {
      setError('Unknown error, please try again later')
    }

    setLoading(false)
  }

  const groupSocialValid =
    groupSocial.startsWith('https://') || groupSocial.includes('@')
  const formInvalid = Boolean(groupSocial && !groupSocialValid)

  const inputClassName = 'p-2 rounded-sm border border-meepGray-200'

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-col space-y-8 p-4 bg-hub-primary-100 rounded-md shadow-hub text-meepGray-500">
        <div className="flex flex-col space-y-2">
          <label className="" htmlFor="first-name">
            First name
          </label>
          <input
            id="first-name"
            type="text"
            autoComplete="given-name"
            className={inputClassName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="" htmlFor="last-name">
            Last name
          </label>
          <input
            id="last-name"
            type="text"
            autoComplete="family-name"
            className={inputClassName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClassName}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col space-y-2">
          <label className="" htmlFor="postcode">
            Postcode
          </label>
          <input
            id="postcode"
            type="text"
            autoComplete="postal-code"
            className={inputClassName}
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            required
          />
          <p className="text-hub-primary-700">
            We{"'"}re only collecting postcodes to map your pledge to the right
            constituency. We won't share or display your postcode.
          </p>
        </div>
        <div className="flex align-items-center gap-2">
          <input
            id="is-group"
            type="checkbox"
            checked={isGroup}
            onChange={(e) => setIsGroup(e.target.checked)}
          />
          <label className="" htmlFor="is-group">
            Are you pledging on behalf of a group?
          </label>
        </div>
        {isGroup ? (
          <>
            <div className="flex flex-col space-y-2">
              <label className="" htmlFor="group">
                Group name
              </label>
              <input
                id="group"
                type="text"
                className={inputClassName}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="" htmlFor="group-site">
                (Optional) Group website
              </label>
              <input
                id="group-site"
                type="url"
                className={inputClassName}
                value={groupURL}
                onChange={(e) => setGroupURL(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <label className="" htmlFor="group-social">
                (Optional) Please share the best way others can connect with
                your group (Facebook page, group email, etc.)
              </label>
              <input
                id="group-social"
                type="url"
                className={inputClassName}
                value={groupSocial}
                onChange={(e) => setGroupSocial(e.target.value)}
              />
              {groupSocial && !groupSocialValid ? (
                <small className="text-red-500">
                  Must be a URL (e.g. https://facebook.com/my-group) or an email
                  address.
                </small>
              ) : null}
            </div>
          </>
        ) : null}
        <div className="flex flex-col space-y-2">
          <label className="" htmlFor="heard-from">
            (Optional) Which organisation did you hear about this action from?
          </label>
          <input
            id="heard-from"
            type="text"
            className={inputClassName}
            value={heardFromOrganisationName}
            onChange={(e) => setHeardFromOrganisationName(e.target.value)}
          />
        </div>
        <div className="flex align-items-center gap-2">
          <input
            id="communication-consent"
            type="checkbox"
            checked={communicationConsent}
            onChange={(e) => setCommunicationConsent(e.target.checked)}
          />
          <label className="" htmlFor="communication-consent">
            Would you like to receive more information from The Climate
            Coalition, including updates about the 12th October, as well as
            resources to help you organise and campaign for climate action in
            your area?
          </label>
        </div>
        <div className="flex align-items-center gap-2">
          <input
            id="map-consent"
            type="checkbox"
            checked={mapConsent}
            onChange={(e) => setMapConsent(e.target.checked)}
          />
          <label className="" htmlFor="map-consent">
            Are you happy for your first name, group name (if applicable) and
            constituency to be displayed on our map?
          </label>
        </div>
        <button
          disabled={loading || formInvalid}
          className={`${!loading ? 'bg-hub-primary-600' : 'bg-meepGray-300'} text-white text-lg rounded-md p-2`}
        >
          {loading ? 'Pledging...' : 'Pledge'}
        </button>
        {error ? <span className="text-red-500">{error}</span> : null}
      </div>
    </form>
  )
}

const HUB_LIST_DATA_SOURCES = gql(`
  query HubListDataSources($currentOrganisationId: ID!) {
    myOrganisations(filters: { id: $currentOrganisationId }) {
      id
      externalDataSources {
        id
        name
        dataType
      }
    }
  }
`)

const ADD_MEMBER = gql(`
  mutation AddMember($externalDataSourceId: String!, $email: String!, $postcode: String!, $customFields: JSON!, $tags: [String!]!) {
    addMember(externalDataSourceId: $externalDataSourceId, email: $email, postcode: $postcode, customFields: $customFields, tags: $tags)
  }
`)
