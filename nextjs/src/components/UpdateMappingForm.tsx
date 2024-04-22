"use client";

import { Button } from "@/components/ui/button";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { EnrichmentLayersQuery, ExternalDataSourceInput, FieldDefinition, PostcodesIoGeographyTypes } from "@/__generated__/graphql";
import { Input } from "@/components/ui/input";
import { SourcePathSelector } from "@/components/SelectSourceData";
import { ArrowRight, Plus, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { gql, useQuery } from "@apollo/client";
import { DataSourceFieldLabel } from "./DataSourceIcon";
import { twMerge } from "tailwind-merge";

const ENRICHMENT_LAYERS = gql`
  query EnrichmentLayers {
    mappingSources {
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
        crmType
      }
    }
  }
`;

export function UpdateMappingForm({
  onSubmit,
  initialData,
  children,
  fieldDefinitions,
  crmType,
  allowMapping = true,
  saveButtonLabel = "Save settings",
}: {
  onSubmit: (
    data: ExternalDataSourceInput,
    e?: React.BaseSyntheticEvent,
  ) => void;
  crmType: string;
  initialData?: ExternalDataSourceInput;
  fieldDefinitions?: FieldDefinition[] | null;
  saveButtonLabel?: string;
  children?: React.ReactNode;
  allowMapping?: boolean;
}) {
  const form = useForm<ExternalDataSourceInput>({
    defaultValues: initialData,
  });
  const data = form.watch();

  const { fields, append, prepend, remove, swap, move, insert } = useFieldArray(
    {
      control: form.control,
      name: "updateMapping",
    },
  );

  const enrichmentLayers = useQuery<EnrichmentLayersQuery>(ENRICHMENT_LAYERS)

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-7">
          <div className='max-w-md'>
            <div className='grid grid-cols-2 gap-4 w-full'>
              {/* Postcode field */}
              <FormField
                control={form.control}
                name="geographyColumn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography Field</FormLabel>
                    <FormControl>
                      {fieldDefinitions?.length ? (
                        // @ts-ignore
                        <Select value={field.value} onValueChange={field.onChange} required>
                          <SelectTrigger className='pl-1'>
                            <SelectValue placeholder={`Choose ${data.geographyColumnType || 'geography'} field`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Geography field</SelectLabel>
                              {fieldDefinitions?.map((field) => (
                                <SelectItem key={field.value} value={field.value}>
                                  <DataSourceFieldLabel fieldDefinition={field} crmType={crmType} />
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
              <FormField
                control={form.control}
                name="geographyColumnType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geography Type</FormLabel>
                    <FormControl>
                      {/* @ts-ignore */}
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a geography type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Geography type</SelectLabel>
                            <SelectItem value={PostcodesIoGeographyTypes.Postcode}>Postcode</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Ward}>Ward</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Council}>Council</SelectItem>
                            <SelectItem value={PostcodesIoGeographyTypes.Constituency}>Constituency</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
            />
            </div>
          </div>
          <div>
            {allowMapping && (
              <>
                <table className='w-full'>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className='flex flex-row'>
                        <td className="w-1/2 grow-0 flex flex-row items-center justify-stretch gap-1">
                          <Button
                            className="flex-shrink"
                            onClick={() => {
                              remove(index);
                            }}
                            variant='outline'
                          >
                            <X className='w-3 h-3' />
                          </Button>
                          <SourcePathSelector
                            focusOnMount={form.watch(`updateMapping.${index}.source`) === "?"}
                            sources={enrichmentLayers.data?.mappingSources || []}
                            value={{
                              source: form.watch(`updateMapping.${index}.source`),
                              sourcePath: form.watch(`updateMapping.${index}.sourcePath`),
                            }}
                            setValue={(source, sourcePath) => {
                              form.setValue(`updateMapping.${index}.source`, source);
                              form.setValue(
                                `updateMapping.${index}.sourcePath`,
                                sourcePath,
                              );
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
                                  {...field}
                                  required
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className={twMerge(field.value && 'pl-1')}>
                                    <SelectValue aria-label={data.updateMapping?.[index]?.destinationColumn} placeholder={`Choose field to update`} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectLabel>Choose a field to update</SelectLabel>
                                      {fieldDefinitions?.map((field) => (
                                        <SelectItem key={field.value} value={field.value}>
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
                          )} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Button
                  type="button"
                  onClick={() => {
                    append({
                      source: "?",
                      sourcePath: "",
                      destinationColumn: "",
                    });
                  }}
                  variant='outline'
                  size='sm'
                  className='my-2'
                >
                  <Plus className='w-4 h-4' /> Add data to another field in your CRM
                </Button>
              </>
            )}
            <div className="flex flex-row gap-x-4 mt-6">
              {children}
              <Button type="submit">
                {saveButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
