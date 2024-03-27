"use client";

import { Button } from "@/components/ui/button";
import { EnrichmentDataSource, enrichmentDataSources } from "@/lib/data";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { DataSourceType, EnrichmentLayersQuery, ExternalDataSourceInput, FieldDefinition, PostcodesIoGeographyTypes } from "@/__generated__/graphql";
import { Input } from "@/components/ui/input";
import { SourcePathSelector } from "@/components/SelectSourceData";
import { ArrowRight, X, XCircle } from "lucide-react";
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
import { useMemo } from "react";
import { DataSourceFieldLabel } from "./DataSourceIcon";
import { twMerge } from "tailwind-merge";

const ENRICHMENT_LAYERS = gql`
  query EnrichmentLayers {
    externalDataSources {
      id
      name
      geographyColumn
      geographyColumnType
      dataType
      crmType
      fieldDefinitions {
        label
        value
        description
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
  saveButtonLabel = "Update",
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

  const customEnrichmentLayers = useQuery<EnrichmentLayersQuery>(ENRICHMENT_LAYERS)
  const sources: EnrichmentDataSource[] = useMemo(() => {
    return enrichmentDataSources.concat(
      customEnrichmentLayers.data?.externalDataSources
      .filter(source => (
        !!source.geographyColumn &&
        !!source.geographyColumnType && 
        !!source.fieldDefinitions?.length &&
        source.dataType !== DataSourceType.Member
      ))
      .map((source) => ({
        slug: source.id,
        name: source.name,
        crmType: source.crmType,
        author: "",
        description: "",
        descriptionURL: "",
        colour: "",
        builtIn: false,
        sourcePaths: source.fieldDefinitions || []
      })) || []
    )
  }, [enrichmentDataSources, customEnrichmentLayers.data?.externalDataSources])

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
                  {fields.map((field, index) => (
                    <tr key={field.id} className='flex flex-row'>
                      <td className="w-1/2 grow-0  flex flex-row items-center justify-stretch">
                        <Button
                          className="flex-shrink"
                          onClick={() => {
                            remove(index);
                          }}
                        >
                          <X />
                        </Button>
                        <SourcePathSelector
                          focusOnMount={form.watch(`updateMapping.${index}.source`) === "?"}
                          sources={sources}
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
                      <td className="w-1/2 shrink-0 flex flex-row items-center justify-stretch">
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
                </table>
                <Button
                  className='w-full'
                  onClick={() => {
                    append({
                      source: "?",
                      sourcePath: "",
                      destinationColumn: "",
                    });
                  }}
                >
                  Add field
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
