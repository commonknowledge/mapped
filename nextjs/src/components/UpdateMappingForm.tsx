'use client'

import { gql, useQuery } from '@apollo/client'
import { useAtomValue } from 'jotai'
import { ArrowRight, Plus, RefreshCcw, X } from 'lucide-react'
import { FormProvider, useFieldArray, useForm } from 'react-hook-form'
import { twMerge } from 'tailwind-merge'

import {
  CrmType,
  EnrichmentLayersQuery,
  ExternalDataSourceInput,
  FieldDefinition,
} from '@/__generated__/graphql'
import { SourcePathSelector } from '@/components/SelectSourceData'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
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

import { DataSourceFieldLabel } from './DataSourceIcon'

const ENRICHMENT_LAYERS = gql`
  query EnrichmentLayers($organisationPk: String!) {
    mappingSources(organisationPk: $organisationPk) {
      slug
      name
      author
      description
      descriptionUrl
      sourcePaths {
        label
        value
        description
      }
      # For custom data sources, get some useful data
      externalDataSource {
        id
        name
        dataType
        crmType
        organisation {
          id
          name
        }
      }
      builtin
    }
  }
`

export function UpdateMappingForm({
  onSubmit,
  initialData,
  children,
  fieldDefinitions,
  refreshFieldDefinitions,
  crmType,
  allowMapping = true,
  saveButtonLabel = 'Save settings',
}: {
  onSubmit: (
    data: ExternalDataSourceInput,
    e?: React.BaseSyntheticEvent
  ) => void
  crmType: CrmType
  initialData?: ExternalDataSourceInput
  refreshFieldDefinitions?: () => void
  fieldDefinitions?: FieldDefinition[] | null
  saveButtonLabel?: string
  children?: React.ReactNode
  allowMapping?: boolean
}) {
  const form = useForm<ExternalDataSourceInput>({
    defaultValues: initialData,
  })
  const data = form.watch()
  const orgId = useAtomValue(currentOrganisationIdAtom)

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control,
      name: 'updateMapping',
    }
  )

  const enrichmentLayers = useQuery<EnrichmentLayersQuery>(ENRICHMENT_LAYERS, {
    variables: { organisationPk: orgId },
  })

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-7">
          <div className="flex flex-row w-full items-end">
            <div className="max-w-md">
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
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Location type</SelectLabel>
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
                <FormField
                  control={form.control}
                  name="geographyColumn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch('geographyColumnType')?.toLocaleLowerCase()}{' '}
                        field
                      </FormLabel>
                      <FormControl>
                        {fieldDefinitions?.length ? (
                          <Select
                            // @ts-ignore
                            value={field.value}
                            onValueChange={field.onChange}
                            required
                          >
                            <SelectTrigger className="pl-1">
                              <SelectValue
                                placeholder={`Choose ${data.geographyColumnType || 'geography'} field`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>
                                  {form
                                    .watch('geographyColumnType')
                                    ?.toLocaleLowerCase()}{' '}
                                  field
                                </SelectLabel>
                                {fieldDefinitions?.map((field) => (
                                  <SelectItem
                                    key={field.value}
                                    value={field.value}
                                  >
                                    <DataSourceFieldLabel
                                      fieldDefinition={field}
                                      crmType={crmType}
                                    />
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        ) : (
                          // @ts-ignore
                          <Input {...field} required />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={refreshFieldDefinitions}
              variant="outline"
              className="flex-shrink-0 ml-auto"
            >
              <RefreshCcw className="w-4 h-4 mr-2" /> Refresh fields
            </Button>
          </div>
          <div>
            {allowMapping && (
              <>
                <table className="w-full">
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="flex flex-row">
                        <td className="w-1/2 grow-0 flex flex-row items-center justify-stretch gap-1">
                          <Button
                            className="flex-shrink"
                            onClick={() => {
                              remove(index)
                            }}
                            variant="outline"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <SourcePathSelector
                            focusOnMount={
                              form.watch(`updateMapping.${index}.source`) ===
                              '?'
                            }
                            loading={enrichmentLayers.loading}
                            sources={
                              enrichmentLayers.data?.mappingSources || []
                            }
                            value={{
                              source: form.watch(
                                `updateMapping.${index}.source`
                              ),
                              sourcePath: form.watch(
                                `updateMapping.${index}.sourcePath`
                              ),
                            }}
                            setValue={(source, sourcePath) => {
                              form.setValue(
                                `updateMapping.${index}.source`,
                                source
                              )
                              form.setValue(
                                `updateMapping.${index}.sourcePath`,
                                sourcePath
                              )
                            }}
                          />
                        </td>
                        <td className="w-1/2 shrink-0 flex flex-row items-center justify-stretch gap-1">
                          <ArrowRight className="flex-shrink-0" />
                          <FormField
                            control={form.control}
                            name={`updateMapping.${index}.destinationColumn`}
                            render={({ field }) => (
                              <>
                                {fieldDefinitions?.length ? (
                                  <Select
                                    {...{ ...field, ref: null }}
                                    required
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger
                                      className={twMerge(field.value && 'pl-1')}
                                    >
                                      <SelectValue
                                        aria-label={
                                          data.updateMapping?.[index]
                                            ?.destinationColumn
                                        }
                                        placeholder={`Choose field to update`}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectGroup>
                                        <SelectLabel>
                                          Choose a field to update
                                        </SelectLabel>
                                        {fieldDefinitions
                                          ?.filter((f) => f.editable)
                                          .map((field) => (
                                            <SelectItem
                                              key={field.value}
                                              value={field.value}
                                            >
                                              <DataSourceFieldLabel
                                                fieldDefinition={field}
                                                crmType={crmType}
                                              />
                                            </SelectItem>
                                          ))}
                                      </SelectGroup>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    className="flex-shrink-0 flex-grow"
                                    placeholder="Field to update"
                                    {...field}
                                    required
                                  />
                                )}
                              </>
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button
                  type="button"
                  onClick={() => {
                    append({
                      source: '?',
                      sourcePath: '',
                      destinationColumn: '',
                    })
                  }}
                  variant="outline"
                  size="sm"
                  className="my-2"
                >
                  <Plus className="w-4 h-4" /> Add data to another field in your
                  CRM
                </Button>
              </>
            )}
            <div className="flex flex-row gap-x-4 mt-6">
              {children}
              <Button type="submit">{saveButtonLabel}</Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  )
}
