'use client'

import { FetchResult, gql, useLazyQuery, useMutation } from '@apollo/client'
import { useAtomValue } from 'jotai'
import { camelCase } from 'lodash'
import { Building, Calendar, Pin, Quote, User, Users } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useContext, useEffect, useMemo, useState } from 'react'
import { FieldPath, FormProvider, useForm } from 'react-hook-form'

import {
  CreateExternalDataSourceInput,
  CreateSourceMutation,
  CrmType,
  DataSourceType,
  ExternalDataSourceInput,
  GeographyTypes,
  GoogleSheetsOauthCredentialsQuery,
  GoogleSheetsOauthCredentialsQueryVariables,
  GoogleSheetsOauthUrlQuery,
  GoogleSheetsOauthUrlQueryVariables,
  TestDataSourceQuery,
  TestDataSourceQueryVariables,
} from '@/__generated__/graphql'
import { PreopulatedSelectField } from '@/components/ExternalDataSourceFields'
import { getFieldsForDataSourceType } from '@/components/UpdateExternalDataSourceFields'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { locationTypeOptions } from '@/lib/location'
import { currentOrganisationIdAtom } from '@/lib/organisation'
import { toastPromise } from '@/lib/toast'

import { formatCrmNames } from '@/lib/utils'
import { CreateAutoUpdateFormContext } from '../../NewExternalDataSourceWrapper'

const TEST_DATA_SOURCE = gql`
  query TestDataSource($input: CreateExternalDataSourceInput!) {
    testDataSource(input: $input) {
      __typename
      crmType
      fieldDefinitions {
        label
        value
        description
        editable
      }
      geographyColumn
      geographyColumnType
      geocodingConfig
      healthcheck
      predefinedColumnNames
      defaultDataType
      remoteName
      allowUpdates
      defaults
      oauthCredentials
    }
  }
`

const GOOGLE_SHEETS_OAUTH_URL = gql`
  query GoogleSheetsOauthUrl($redirectUrl: String!) {
    googleSheetsOauthUrl(redirectUrl: $redirectUrl)
  }
`

const GOOGLE_SHEETS_OAUTH_CREDENTIALS = gql`
  query GoogleSheetsOauthCredentials($redirectSuccessUrl: String!) {
    googleSheetsOauthCredentials(redirectSuccessUrl: $redirectSuccessUrl)
  }
`

const CREATE_DATA_SOURCE = gql`
  mutation CreateSource($input: CreateExternalDataSourceInput!) {
    createExternalDataSource(input: $input) {
      code
      errors {
        message
      }
      result {
        id
        name
        crmType
        dataType
        allowUpdates
      }
    }
  }
`

type FormInputs = CreateExternalDataSourceInput &
  ExternalDataSourceInput & {
    temp?: {
      airtableBaseUrl?: string
      actionnetworkGroupUrl?: string
    }
  }

export default function Page({
  params: { externalDataSourceType },
}: {
  params: { externalDataSourceType: keyof CreateExternalDataSourceInput }
}) {
  const orgId = useAtomValue(currentOrganisationIdAtom)
  const router = useRouter()
  const context = useContext(CreateAutoUpdateFormContext)

  useEffect(() => {
    context.setStep(2)
  }, [context])

  const defaultValues: CreateExternalDataSourceInput & ExternalDataSourceInput =
    {
      name: '',
      geographyColumnType: GeographyTypes.Postcode,
      geographyColumn: '',
      dataType: context.dataType,
      airtable: {
        apiKey: '',
        baseId: '',
        tableId: '',
      },
      mailchimp: {
        apiKey: '',
        listId: '',
      },
      actionnetwork: {
        apiKey: '',
        groupSlug: '',
      },
      editablegooglesheets: {
        oauthCredentials: '',
        spreadsheetId: '',
        sheetName: '',
      },
      tickettailor: {
        apiKey: '',
      },
    }

  const form = useForm<FormInputs>({
    defaultValues: {
      ...defaultValues,
    } as FormInputs,
  })

  const searchParams = useSearchParams()

  const [googleSheetsOauthCredentials, googleSheetsOauthCredentialsResult] =
    useLazyQuery<
      GoogleSheetsOauthCredentialsQuery,
      GoogleSheetsOauthCredentialsQueryVariables
    >(GOOGLE_SHEETS_OAUTH_CREDENTIALS)

  useEffect(() => {
    // The presence of these URL parameters indicates an OAuth redirect
    // back from Google. Convert these into oauth_credentials using
    // the GoogleSheetsOauthCredentialsQuery, then save the
    // credentials in the form object.
    if (searchParams.get('state') && searchParams.get('code')) {
      toastPromise(
        googleSheetsOauthCredentials({
          variables: { redirectSuccessUrl: window.location.href },
        }),
        {
          loading: 'Completing Google authorization...',
          success: (d: FetchResult<GoogleSheetsOauthCredentialsQuery>) => {
            if (!d.errors && d.data?.googleSheetsOauthCredentials) {
              form.setValue(
                'editablegooglesheets.oauthCredentials',
                d.data.googleSheetsOauthCredentials
              )
              return 'Google authorization succeeded'
            }
            throw new Error('Google authorization failed')
          },
          error: () => {
            return 'Google authorization failed'
          },
        }
      )
    }
  }, []) // No dependencies here so useEffect only runs once

  const dataType = form.watch('dataType') as DataSourceType
  const collectFields = useMemo(() => {
    return getFieldsForDataSourceType(dataType)
  }, [dataType])

  const geographyFields = [
    'geographyColumn',
    'geographyColumnType',
    'geocodingConfig',
  ]

  async function fetchSheetNamesUsingCredentials(
    spreadsheetId: string,
    oauthCredentials: string
  ): Promise<string[]> {
    const parsedCredentials = JSON.parse(oauthCredentials)
    const accessToken = parsedCredentials.access_token

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    }
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        method: 'GET',
        headers,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('API Error:', error)
      throw new Error(error.error.message || 'Failed to fetch sheet names')
    }
    const data = await response.json()
    const sheets = data.sheets || []
    return sheets.map(
      (sheet: { properties: { title: string } }) => sheet.properties.title
    )
  }
  const [sheetNames, setSheetNames] = useState<string[]>([])
  const [loadingSheets, setLoadingSheets] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sheetUrl, setSheetUrl] = useState<string>('')

  function extractBaseAndTableId(url: string): {
    baseId?: string
    tableId?: string
  } {
    try {
      const match = url.match(/\/(app[a-zA-Z0-9]+)\/(tbl[a-zA-Z0-9]+)/)
      if (match) {
        const [, baseId, tableId] = match
        return { baseId, tableId }
      }
      return {}
    } catch (error) {
      console.error('Error extracting Base ID and Table ID:', error)
      return {}
    }
  }

  function extractActionNetworkGroupSlug(url: string): string | null {
    try {
      const match = url.match(/\/groups\/([a-zA-Z0-9-]+)\//)
      return match ? match[1] : null
    } catch (error) {
      console.error('Error extracting group slug:', error)
      return null
    }
  }

  async function handleSheetUrlChange(
    url: string,
    setSheetUrl: React.Dispatch<React.SetStateAction<string>>,
    form: ReturnType<typeof useForm>,
    setLoadingSheets: React.Dispatch<React.SetStateAction<boolean>>,
    setSheetNames: React.Dispatch<React.SetStateAction<string[]>>,
    fetchSheetNamesUsingCredentials: (
      spreadsheetId: string,
      oauthCredentials: string
    ) => Promise<string[]>,
    setFetchError: React.Dispatch<React.SetStateAction<string | null>>
  ) {
    setSheetUrl(url)
    try {
      const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
      if (match && match[1]) {
        const spreadsheetId = match[1]
        form.setValue('editablegooglesheets.spreadsheetId', spreadsheetId)
        setLoadingSheets(true)
        const oauthCredentials = form.getValues(
          'editablegooglesheets.oauthCredentials'
        )
        if (oauthCredentials) {
          const sheets = await fetchSheetNamesUsingCredentials(
            spreadsheetId,
            oauthCredentials
          )
          setSheetNames(sheets)
        } else {
          throw new Error('OAuth credentials not available')
        }

        setLoadingSheets(false)
      }
    } catch (err) {
      setFetchError(
        'Failed to fetch sheet names. Please check the URL or credentials.'
      )
      setLoadingSheets(false)
    }
  }

  const [createSource, createSourceResult] =
    useMutation<CreateSourceMutation>(CREATE_DATA_SOURCE)
  const [testSource, testSourceResult] = useLazyQuery<
    TestDataSourceQuery,
    TestDataSourceQueryVariables
  >(TEST_DATA_SOURCE)
  const [googleSheetsOauthUrl, googleSheetsOauthUrlResult] = useLazyQuery<
    GoogleSheetsOauthUrlQuery,
    GoogleSheetsOauthUrlQueryVariables
  >(GOOGLE_SHEETS_OAUTH_URL)
  const [googleSheetsError, setGoogleSheetsError] = useState('')

  const currentSource = testSourceResult.data

  const [guessed, setGuessed] = useState<
    Partial<Record<FieldPath<FormInputs>, string | undefined | null>>
  >({})

  /**
   * For a field that maps a data source property (e.g. address_field) to
   * a field on the remote data source (e.g. "Address Line 1"), try to guess the
   * remote field based on a list of likely options, while preventing bad matches
   * (e.g. "Email address" for "Address").
   *
   * In this example, field = "addressField", guessKeys = ["address", "line1", ...],
   * badKeys = ["email"].
   */
  function useGuessedField(
    field: keyof FormInputs,
    guessKeys: string[],
    badKeys: string[] = []
  ) {
    useEffect(() => {
      // If this data isn't being collected for this source type, set the source
      // field for this data to null. This prevents accidentally trying to collect
      // invalid data (for example start times for data that is not events).
      // @ts-ignore
      if (!collectFields.includes(field) && !geographyFields.includes(field)) {
        form.setValue(field, null)
        return
      }
      const guess =
        testSourceResult.data?.testDataSource.fieldDefinitions?.find(
          (field: { label?: string | null; value: string }) => {
            const isMatch = (
              fieldName: string | null | undefined,
              guessKey: string
            ) => {
              if (!fieldName) {
                return false
              }
              const match = fieldName
                .toLowerCase()
                .replaceAll(' ', '')
                .includes(guessKey.replaceAll(' ', ''))
              if (!match) {
                return false
              }
              for (const badKey of badKeys) {
                const badMatch = fieldName
                  .toLowerCase()
                  .replaceAll(' ', '')
                  .includes(badKey.replaceAll(' ', ''))
                if (badMatch) {
                  return false
                }
              }
              return true
            }
            for (const guessKey of guessKeys) {
              if (
                isMatch(field.label, guessKey) ||
                isMatch(field.value, guessKey)
              ) {
                return true
              }
            }
          }
        )
      if (guess?.value) {
        setGuessed((guesses) => ({ ...guesses, [field]: guess?.value }))
        // @ts-ignore
        form.setValue(field, guess?.value)
      }
    }, [
      testSourceResult.data?.testDataSource.fieldDefinitions,
      form,
      collectFields,
      setGuessed,
    ])
  }

  useGuessedField('geographyColumn', [
    'postcode',
    'postal code',
    'zip code',
    'zip',
  ])
  useGuessedField('emailField', ['email'])
  useGuessedField('phoneField', ['mobile', 'phone'])
  useGuessedField(
    'addressField',
    ['street', 'line1', 'address', 'location', 'venue'],
    ['email']
  )
  useGuessedField('fullNameField', ['full name', 'name'])
  useGuessedField('firstNameField', ['first name', 'given name'])
  useGuessedField('titleField', ['title', 'name'])
  useGuessedField('descriptionField', [
    'description',
    'body',
    'comments',
    'notes',
    'about',
  ])
  useGuessedField('imageField', [
    'image',
    'photo',
    'picture',
    'avatar',
    'attachment',
    'attachments',
    'file',
    'files',
    'graphic',
    'poster',
    'logo',
    'icon',
  ])
  useGuessedField('startTimeField', [
    'start',
    'start time',
    'start date',
    'begin',
    'beginning',
    'start_at',
    'start_time',
    'start_date',
    'date',
    'time',
    'datetime',
    'timestamp',
    'from',
  ])
  useGuessedField('endTimeField', [
    'end',
    'end time',
    'end date',
    'finish',
    'finish time',
    'finish date',
    'end_at',
    'end_time',
    'end_date',
    'until',
  ])
  useGuessedField('publicUrlField', [
    'public url',
    'public link',
    'public',
    'url',
    'link',
    'website',
    'webpage',
    'web',
    'page',
    'site',
    'href',
    'uri',
    'path',
    'slug',
    'permalink',
  ])
  useGuessedField('socialUrlField', [
    'social url',
    'social link',
    'social',
    'facebook',
    'instagram',
  ])

  useEffect(() => {
    if (testSourceResult.data?.testDataSource?.defaultDataType) {
      const dataType = testSourceResult.data.testDataSource
        .defaultDataType as DataSourceType
      context.dataType = dataType
      form.setValue('dataType', dataType)
      // Default dict
      const defaultFieldValues =
        testSourceResult.data.testDataSource.defaults || {}
      for (const key in defaultFieldValues) {
        const camelCasedKey = camelCase(key) as keyof FormInputs
        const value = defaultFieldValues[key]
        if (value !== null && value !== undefined) {
          form.setValue(camelCasedKey, value)
        }
      }
    }
  }, [testSourceResult.data])

  const airtableUrl = form.watch('temp.airtableBaseUrl')

  useEffect(() => {
    if (airtableUrl) {
      try {
        const { baseId, tableId } = extractBaseAndTableId(airtableUrl)
        if (baseId) {
          form.setValue('airtable.baseId', baseId)
        }
        if (tableId) {
          form.setValue('airtable.tableId', tableId)
        }
      } catch (e) {
        // Invalid URL
        form.setError('temp.airtableBaseUrl', {
          type: 'validate',
          message: 'Invalid URL',
        })
      }
    }
  }, [airtableUrl])

  async function submitTestConnection(formData: FormInputs) {
    if (!formData[externalDataSourceType]) {
      throw Error('Need some CRM connection details to proceed!')
    }

    // To avoid mutation of the form data
    const genericCRMData = Object.assign({}, formData)
    const CRMSpecificData = formData[externalDataSourceType]

    // Remove specific CRM data from the generic data
    // TODO: make this less fragile. Currently it assumes any nested
    // object is specific to a CRM.
    for (const key of Object.keys(formData)) {
      if (typeof formData[key as keyof FormInputs] === 'object') {
        delete genericCRMData[key as keyof FormInputs]
      }
    }

    const input: TestDataSourceQueryVariables['input'] = {
      [externalDataSourceType]: {
        ...genericCRMData,
        ...CRMSpecificData,
      },
    }

    toastPromise(
      testSource({
        variables: { input },
      }),
      {
        loading: 'Testing connection...',
        success: (d: FetchResult<TestDataSourceQuery>) => {
          if (
            !d.errors &&
            d.data?.testDataSource &&
            d.data.testDataSource.healthcheck
          ) {
            return 'Connection is healthy'
          }
          throw new Error(
            d.errors?.map((e) => e.message).join(', ') || 'Unknown error'
          )
        },
        error: 'Connection failed',
      }
    )
  }

  async function submitCreateSource(formData: FormInputs) {
    if (!formData[externalDataSourceType]) {
      throw Error('Need some CRM connection details to proceed!')
    }
    // To avoid mutation of the form data
    const genericCRMData = Object.assign({}, formData)
    let CRMSpecificData = formData[externalDataSourceType]

    // Remove specific CRM data from the generic data
    // TODO: make this less fragile. Currently it assumes any nested
    // object is specific to a CRM.
    for (const key of Object.keys(formData)) {
      if (typeof formData[key as keyof FormInputs] === 'object') {
        delete genericCRMData[key as keyof FormInputs]
      }
    }

    let input: CreateExternalDataSourceInput = {
      [externalDataSourceType]: {
        ...genericCRMData,
        ...CRMSpecificData,
        organisation: { set: orgId },
      },
    }
    toastPromise(createSource({ variables: { input } }), {
      loading: 'Saving connection...',
      success: (d) => {
        const errors = d.errors || d.data?.createExternalDataSource.errors || []
        if (!errors.length && d.data?.createExternalDataSource.result) {
          if (
            d.data?.createExternalDataSource.result.dataType ===
              DataSourceType.Member &&
            d.data.createExternalDataSource.result.allowUpdates
          ) {
            router.push(
              `/data-sources/create/configure/${d.data.createExternalDataSource.result.id}`
            )
          } else {
            router.push(
              `/data-sources/inspect/${d.data.createExternalDataSource.result.id}`
            )
          }
          return 'Connection successful'
        }
        throw new Error(
          errors.map((e) => e.message).join(', ') || 'Unknown error'
        )
      },
      error(e) {
        return {
          title: 'Connection failed',
          description: e.message,
        }
      },
    })
  }

  if (
    createSourceResult.loading ||
    createSourceResult.data?.createExternalDataSource.result
  ) {
    return (
      <div className="space-y-6">
        <h1 className="text-hLg">Saving connection...</h1>
        <p className="text-meepGray-400 max-w-lg">
          Please wait whilst we save your connection details
        </p>
        <LoadingIcon />
      </div>
    )
  }

  function FPreopulatedSelectField({
    name,
    label,
    placeholder,
    required = false,
    helpText = '',
  }: {
    name: FieldPath<FormInputs>
    label?: string
    placeholder?: string
    required?: boolean
    helpText?: string
  }) {
    return (
      <PreopulatedSelectField
        name={name}
        label={label}
        placeholder={placeholder}
        fieldDefinitions={
          testSourceResult.data?.testDataSource.fieldDefinitions
        }
        control={form.control}
        crmType={testSourceResult.data?.testDataSource.crmType!}
        guess={guessed[name]}
        required={required}
        helpText={helpText}
      />
    )
  }

  if (currentSource?.testDataSource?.healthcheck) {
    return (
      <div className="space-y-6">
        <h1 className="text-hLg">Connection successful</h1>
        <p className="text-meepGray-400 max-w-lg">
          Tell us a bit more about the data you{"'"}re connecting to.
        </p>
        <FormProvider {...form}>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(submitCreateSource)}
              className="space-y-7 max-w-lg"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Input
                        placeholder="My members list"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>
                      This will be visible to your team.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!currentSource?.testDataSource?.defaultDataType && (
                <FormField
                  control={form.control}
                  name="dataType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          /* @ts-ignore */
                          defaultValue={field.value}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="What kind of data is this?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Type of data source</SelectLabel>
                              <SelectItem value={DataSourceType.Member}>
                                <div className="flex flex-row gap-2 items-center">
                                  <User className="w-4 text-meepGray-300" />{' '}
                                  People
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.AreaStats}>
                                <div className="flex flex-row gap-2 items-center">
                                  <User className="w-4 text-meepGray-300" />{' '}
                                  Area Stats
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.Group}>
                                <div className="flex flex-row gap-2 items-center">
                                  <Users className="w-4 text-meepGray-300" />{' '}
                                  Group
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.Event}>
                                <div className="flex flex-row gap-2 items-center">
                                  <Calendar className="w-4 text-meepGray-300" />{' '}
                                  Events
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.Story}>
                                <div className="flex flex-row gap-2 items-center">
                                  <Quote className="w-4 text-meepGray-300" />{' '}
                                  Stories
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.Location}>
                                <div className="flex flex-row gap-2 items-center">
                                  <Building className="w-4 text-meepGray-300" />{' '}
                                  Locations
                                </div>
                              </SelectItem>
                              <SelectItem value={DataSourceType.Other}>
                                <div className="flex flex-row gap-2 items-center">
                                  <Pin className="w-4 text-meepGray-300" />{' '}
                                  Other
                                </div>
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!currentSource?.testDataSource?.predefinedColumnNames && (
                <div className="grid grid-cols-2 gap-4 w-full">
                  <FormField
                    control={form.control}
                    name="geographyColumnType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of location data</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            /* @ts-ignore */
                            defaultValue={field.value}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a geography type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Geography type</SelectLabel>
                                {locationTypeOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FPreopulatedSelectField
                    name="geographyColumn"
                    label={`${form.watch('geographyColumnType')?.toLocaleLowerCase()} field`}
                    required
                  />
                  {testSourceResult.data?.testDataSource.crmType ===
                    CrmType.Editablegooglesheets && (
                    <FPreopulatedSelectField
                      name="editablegooglesheets.idField"
                      label="Unique field"
                      required
                      helpText={`
                      Choose a column in your data that should always contain a unique value
                      (e.g. email address for members, creation timestamp for events, etc.)
                    `}
                    />
                  )}
                  {collectFields.map((field) => (
                    <FPreopulatedSelectField key={field} name={field} />
                  ))}
                </div>
              )}
              <Button
                type="submit"
                variant="reverse"
                disabled={createSourceResult.loading}
              >
                Save connection
              </Button>
            </form>
          </Form>
        </FormProvider>
      </div>
    )
  }

  if (testSourceResult.loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-hLg">Testing connection...</h1>
        <p className="text-meepGray-400 max-w-lg">
          Please wait whilst we try to connect to your{' '}
          {formatCrmNames(externalDataSourceType || 'CRM')} using the
          information you provided
        </p>
        <LoadingIcon />
      </div>
    )
  }

  if (externalDataSourceType === 'airtable') {
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">Connecting to your Airtable base</h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            In order to send data across to your Airtable, we{"'"}ll need a few
            details that give us permission to make updates to your base, as
            well as tell us which table to update in the first place.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitTestConnection)}
            className="space-y-7 max-w-lg"
          >
            <div className="text-hSm">Connection details</div>
            <FormField
              control={form.control}
              name="temp.airtableBaseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airtable URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://airtable.com/app123/tbl123"
                      {...field}
                      onBlur={(e) => {
                        const { baseId, tableId } = extractBaseAndTableId(
                          e.target.value
                        )
                        if (baseId) form.setValue('airtable.baseId', baseId)
                        if (tableId) form.setValue('airtable.tableId', tableId)
                      }}
                      required
                    />
                  </FormControl>
                  <FormDescription>
                    The URL for your Airtable base.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airtable.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airtable access token</FormLabel>
                  <FormControl>
                    <Input placeholder="patAB1" {...field} required />
                  </FormControl>
                  <div className="text-sm text-meepGray-400">
                    <span>
                      Your token should have access to the base and the
                      following scopes:
                    </span>
                    <ul className="list-disc list-inside pl-1">
                      <li>
                        <code>data.records:read</code>
                      </li>
                      <li>
                        <code>data.records:write</code>
                      </li>
                      <li>
                        <code>schema.bases:read</code>
                      </li>
                      <li>
                        <code>webhook:manage</code>
                      </li>
                    </ul>
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/creating-personal-access-tokens#:~:text=Click%20the%20Developer%20hub%20option,right%20portion%20of%20the%20screen."
                    >
                      Learn how to find your personal access token.
                    </a>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  router.back()
                }}
              >
                Back
              </Button>
              <Button type="submit" variant={'reverse'}>
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }
  if (externalDataSourceType === 'mailchimp') {
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">Connecting to your Mailchimp audience</h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            In order to send data across to your Mailchimp audience, we{"'"}ll
            need a few details that gives us permission to make updates to your
            audience, as well as tell us which audience to update in the first
            place.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitTestConnection)}
            className="space-y-7 max-w-lg"
          >
            <div className="text-hSm">Connection details</div>
            <FormField
              control={form.control}
              name="mailchimp.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>MailChimp API key</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="X...-usXX" {...field} required />
                  </FormControl>
                  <FormDescription>
                    {' '}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://mailchimp.com/help/about-api-keys/"
                    >
                      Learn how to find your API key.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mailchimp.listId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience ID</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="XXXXXXXXXX" {...field} required />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your audience.{' '}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://mailchimp.com/help/find-audience-id/"
                    >
                      Learn how to find your audience ID.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  router.back()
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant={'reverse'}
                disabled={testSourceResult.loading}
              >
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }
  if (externalDataSourceType === 'actionnetwork') {
    const groupSlug = form.watch('actionnetwork.groupSlug')
    const actionNetworkApiUrl = groupSlug
      ? `https://actionnetwork.org/groups/${groupSlug}/apis`
      : ''
    const showApiKeyField = !!groupSlug

    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">
            Connecting to your Action Network instance
          </h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            In order to send data across to your Action Network instance, we
            {"'"}ll need a few details that give us permission to make updates
            to your members.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitTestConnection)}
            className="space-y-7 max-w-lg"
          >
            <div className="text-hSm">Connection details</div>
            <FormField
              control={form.control}
              name="temp.actionnetworkGroupUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Network Group URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://actionnetwork.org/groups/testgroup-3/manage"
                      {...field}
                      onBlur={(e) => {
                        const slug = extractActionNetworkGroupSlug(
                          e.target.value
                        )
                        if (slug) {
                          form.setValue('actionnetwork.groupSlug', slug)
                        } else {
                          form.setError('temp.actionnetworkGroupUrl', {
                            type: 'validate',
                            message: 'Invalid URL',
                          })
                        }
                      }}
                      required
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the URL of your Action Network group here.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {groupSlug && (
              <p className="text-meepGray-400">
                Use the following link to access your API key settings:
                <a
                  href={actionNetworkApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline ml-2"
                >
                  {actionNetworkApiUrl}
                </a>
              </p>
            )}
            {showApiKeyField && (
              <FormField
                control={form.control}
                name="actionnetwork.apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Network API key</FormLabel>
                    <FormControl>
                      <Input placeholder="52b...bce" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  router.back()
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant={'reverse'}
                disabled={testSourceResult.loading}
              >
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }
  if (externalDataSourceType === 'editablegooglesheets') {
    const hasOauthParams = searchParams.get('state') && searchParams.get('code')
    // The presence of the params and absence of an oauthCredentialsResult
    // means the query has either not yet been sent, or is in progress.
    // Checking this instead of the `loading` property catches the
    // case where the page has been loaded but the query hasn't
    // yet been sent.
    const oauthCredentialsLoading =
      hasOauthParams &&
      !googleSheetsOauthCredentialsResult.data &&
      !googleSheetsOauthCredentialsResult.error
    if (oauthCredentialsLoading) {
      return (
        <div className="space-y-7">
          <header>
            <h1 className="text-hLg">
              Connecting to your Google Sheets spreadsheet
            </h1>
          </header>
          <LoadingIcon />
        </div>
      )
    }
    if (!form.watch('editablegooglesheets.oauthCredentials')) {
      return (
        <div className="space-y-7">
          <header>
            <h1 className="text-hLg">
              Connecting to your Google Sheets spreadsheet
            </h1>
            <p className="mt-6 text-meepGray-400 max-w-lg">
              Click the button below to grant Mapped permission to access your
              spreadsheet.
            </p>
          </header>
          <div className="flex flex-row gap-x-4">
            <Button
              variant="outline"
              type="reset"
              onClick={() => {
                // Can't use router.back() as this could take the user
                // back to the Google OAuth screen
                router.push('/data-sources')
              }}
            >
              Back
            </Button>
            <Button
              type="button"
              variant={'reverse'}
              disabled={googleSheetsOauthUrlResult.loading}
              onClick={() => {
                setGoogleSheetsError('')

                // Remove Google parameters from any previous failed request
                const redirectUrl = new URL(window.location.href)
                redirectUrl.searchParams.delete('code')
                redirectUrl.searchParams.delete('error')
                redirectUrl.searchParams.delete('state')
                redirectUrl.searchParams.delete('scope')

                googleSheetsOauthUrl({
                  variables: { redirectUrl: redirectUrl.toString() },
                })
                  .then(({ data }) => {
                    if (!data?.googleSheetsOauthUrl) {
                      throw Error('Missing data')
                    }
                    window.location.href = data.googleSheetsOauthUrl
                  })
                  .catch((e) => {
                    console.error('Error: ', e)
                    setGoogleSheetsError(
                      'Could not get Google authorization URL, please try again.'
                    )
                  })
              }}
            >
              Authorize
            </Button>
          </div>
          {googleSheetsError && (
            <small className="text-red-500">{googleSheetsError}</small>
          )}
        </div>
      )
    }
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">
            Connecting to your Google Sheets spreadsheet
          </h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            Now we just need a few details to know which spreadsheet to import
            and update.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitTestConnection)}
            className="space-y-7 max-w-lg"
          >
            <FormField
              control={form.control}
              name="editablegooglesheets.spreadsheetId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Sheets URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://docs.google.com/spreadsheets/d/1MEDFli9uakvmf_wGghJZtZg2AvF2xybGtiaG7OX1mmg/edit#gid=0"
                      value={sheetUrl}
                      onChange={(e) =>
                        handleSheetUrlChange(
                          e.target.value,
                          setSheetUrl,
                          form,
                          setLoadingSheets,
                          setSheetNames,
                          fetchSheetNamesUsingCredentials,
                          setFetchError
                        )
                      }
                      required
                    />
                  </FormControl>
                  <FormDescription>
                    Paste the URL of your Google Sheets document
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="editablegooglesheets.sheetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sheet Name</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      required
                      disabled={loadingSheets || !sheetNames.length}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingSheets ? 'Loading...' : 'Select a sheet'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {fetchError && (
                    <small className="text-red-500">{fetchError}</small>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  // Can't use router.back() as this could take the user
                  // back to the Google OAuth screen
                  router.push('/data-sources')
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant={'reverse'}
                disabled={testSourceResult.loading}
              >
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  if (externalDataSourceType === 'tickettailor') {
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">
            Connecting to your Ticket Tailor box office
          </h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            In order to import data from your Ticket Tailor box office, we{"'"}
            ll need a few details.
          </p>
        </header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(submitTestConnection)}
            className="space-y-7 max-w-lg"
          >
            <div className="text-hSm">Connection details</div>
            <FormField
              control={form.control}
              name="tickettailor.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Tailor API key</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="sk_629...e" {...field} required />
                  </FormControl>
                  <FormDescription>
                    Your API key can be found or generated in the Box Office
                    Settings under API.{' '}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://help.tickettailor.com/en/articles/4593218-how-do-i-connect-to-the-ticket-tailor-api"
                    >
                      Guide to finding your API key.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-row gap-x-4">
              <Button
                variant="outline"
                type="reset"
                onClick={() => {
                  router.back()
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                variant={'reverse'}
                disabled={testSourceResult.loading}
              >
                Test connection
              </Button>
            </div>
          </form>
        </Form>
      </div>
    )
  }

  return null
}
