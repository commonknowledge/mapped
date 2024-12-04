'use client'

import { FetchResult, gql, useLazyQuery, useMutation } from '@apollo/client'
import { useAtomValue } from 'jotai'
import { camelCase } from 'lodash'
import { Building, Calendar, Pin, Quote, User, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useContext, useEffect, useMemo, useState } from 'react'
import { FieldPath, FormProvider, useForm } from 'react-hook-form'

import {
  CreateExternalDataSourceInput,
  CreateSourceMutation,
  CrmType,
  DataSourceType,
  EditableGoogleSheetsSourceInput,
  ExternalDataSourceInput,
  GeographyTypes,
  GoogleSheetsAuthUrlQuery,
  GoogleSheetsAuthUrlQueryVariables,
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

const GOOGLE_SHEETS_AUTH_URL = gql`
  query GoogleSheetsAuthUrl($redirectUrl: String!) {
    googleSheetsAuthUrl(redirectUrl: $redirectUrl)
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

  const RNN_ORIG = Symbol()

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
        redirectSuccessUrl: '',
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

  useEffect(() => {
    const urlParams = new URLSearchParams(
      typeof window === 'undefined' ? '' : window.location.search
    )
    if (urlParams.get('state') && urlParams.get('code')) {
      form.setValue(
        'editablegooglesheets.redirectSuccessUrl',
        window.location.href
      )
    }
  }, [form])

  const dataType = form.watch('dataType') as DataSourceType
  const collectFields = useMemo(() => {
    return getFieldsForDataSourceType(dataType)
  }, [dataType])
  const geographyFields = ['geographyColumn', 'geographyColumnType']

  const [createSource, createSourceResult] =
    useMutation<CreateSourceMutation>(CREATE_DATA_SOURCE)
  const [testSource, testSourceResult] = useLazyQuery<
    TestDataSourceQuery,
    TestDataSourceQueryVariables
  >(TEST_DATA_SOURCE)
  const [googleSheetsAuthUrl, googleSheetsAuthUrlResult] = useLazyQuery<
    GoogleSheetsAuthUrlQuery,
    GoogleSheetsAuthUrlQueryVariables
  >(GOOGLE_SHEETS_AUTH_URL)
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
  const baseId = form.watch('airtable.baseId')
  const tableId = form.watch('airtable.tableId')

  useEffect(() => {
    if (airtableUrl) {
      try {
        const url = new URL(airtableUrl)
        const [_, base, table, ...pathSegments] = url.pathname.split('/')
        form.setValue('airtable.baseId', base)
        form.setValue('airtable.tableId', table)
      } catch (e) {
        // Invalid URL
        form.setError('temp.airtableBaseUrl', {
          type: 'validate',
          message: 'Invalid URL',
        })
        return
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

    // TODO: can this be less messy?
    if (externalDataSourceType === CrmType.Editablegooglesheets) {
      // Remove the redirectSuccessUrl from the variables and replace it
      // with the credentials returned when the connection was tested.
      // Cannot reuse the oauth parameters in the URL to get new
      // credentials on the back-end, as they are one-use only.
      CRMSpecificData = CRMSpecificData as EditableGoogleSheetsSourceInput
      delete CRMSpecificData['redirectSuccessUrl']
      CRMSpecificData['oauthCredentials'] =
        testSourceResult.data?.testDataSource.oauthCredentials
    }

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
          Please wait whilst we try to connect to your CRM using the information
          you provided
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
            details that gives us permission to make updates to your base, as
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
              name="airtable.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Airtable access token</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="patAB1" {...field} required />
                  </FormControl>
                  <div className="text-sm text-meepGray-400">
                    <span>
                      Your token should have access to the base and the
                      following {'"'}scopes{'"'}:
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
            {!baseId && !tableId && (
              <FormField
                control={form.control}
                name="temp.airtableBaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airtable URL</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Input
                        placeholder="https://airtable.com/app123/tbl123"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormDescription>
                      The URL for your airtable base.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="airtable.baseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base ID</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="app1234" {...field} required />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your base.{' '}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs"
                    >
                      Learn how to find your base ID.
                    </a>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="airtable.tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table ID</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="tbl1234" {...field} required />
                  </FormControl>
                  <FormDescription>
                    The unique identifier for your table.{' '}
                    <a
                      className="underline"
                      target="_blank"
                      href="https://support.airtable.com/docs/en/finding-airtable-ids#:~:text=Finding%20base%20URL%20IDs,-Base%20URLs"
                    >
                      Learn how to find your table ID.
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
    return (
      <div className="space-y-7">
        <header>
          <h1 className="text-hLg">
            Connecting to your Action Network instance
          </h1>
          <p className="mt-6 text-meepGray-400 max-w-lg">
            In order to send data across to your Action Network instance, we
            {"'"}ll need a few details that gives us permission to make updates
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
              name="actionnetwork.groupSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Network Group Slug</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="my-group" {...field} required />
                  </FormControl>
                  <FormDescription>
                    {`
                    Get your group slug from the group dashboard in Action
                    Network. The URL will be
                    https://actionnetwork.org/groups/"your-group-name"/manage, 
                    with your group slug in the place of "your-group_name".
                    `}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="actionnetwork.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Network API key</FormLabel>
                  <FormControl>
                    {/* @ts-ignore */}
                    <Input placeholder="52b...bce" {...field} required />
                  </FormControl>
                  <FormDescription>
                    Your API keys and sync features can be managed from the{' '}
                    {'"'}API & Sync{'"'} link available in the {'"'}Start
                    Organizing{'"'} menu.
                    <a
                      className="underline"
                      target="_blank"
                      href="https://actionnetwork.org/docs/"
                    >
                      Read more.
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

  if (externalDataSourceType === 'editablegooglesheets') {
    const redirectSuccessUrl = form.watch(
      'editablegooglesheets.redirectSuccessUrl'
    )
    return (
      <div className="space-y-7">
        {!redirectSuccessUrl ? (
          <>
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
                disabled={googleSheetsAuthUrlResult.loading}
                onClick={() => {
                  setGoogleSheetsError('')
                  googleSheetsAuthUrl({
                    variables: { redirectUrl: window.location.href },
                  })
                    .then(({ data }) => {
                      if (!data?.googleSheetsAuthUrl) {
                        throw Error('Missing data')
                      }
                      window.location.href = data.googleSheetsAuthUrl
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
          </>
        ) : (
          <>
            <header>
              <h1 className="text-hLg">
                Connecting to your Google Sheets spreadsheet
              </h1>
              <p className="mt-6 text-meepGray-400 max-w-lg">
                Now we just need a few details to know which spreadsheet to
                import and update.
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
                      <FormLabel>Spreadsheet ID</FormLabel>
                      <FormControl>
                        {/* @ts-ignore */}
                        <Input
                          placeholder="1MEDFli9uakvmf_wGghJZtZg2AvF2xybGtiaG7OX1mmg"
                          {...field}
                          required
                        />
                      </FormControl>
                      <FormDescription>
                        Get your spreadsheet ID from its URL in the address bar
                        of the browser. The URL will be
                        <code className="block bg-black p-2 rounded my-2">
                          https://docs.google.com/spreadsheets/d/spreadsheet-id/edit?gid=0#gid=0e
                        </code>
                        with your ID in the place of {'"'}spreadsheet-id{'"'}.
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
                        {/* @ts-ignore */}
                        <Input placeholder="Sheet1" {...field} required />
                      </FormControl>
                      <FormDescription>
                        The name of the sheet with data you want
                        imported/updated. This is {'"'}Sheet1{'"'} by default.
                        You can find it on the tabs at the bottom of your
                        spreadsheet.
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
          </>
        )}
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
                    Settings under API.
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
