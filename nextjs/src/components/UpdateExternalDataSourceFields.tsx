import { FieldPath, FormProvider, useForm } from "react-hook-form";
import { Button } from "./ui/button";
import { CrmType, DataSourceType, ExternalDataSourceInput, FieldDefinition, GeographyTypes } from "@/__generated__/graphql";
import { PreopulatedSelectField } from "./ExternalDataSourceFields";
import {
  FormControl,
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
import { DataSourceFieldLabel } from "./DataSourceIcon";
import { Input } from "@/components/ui/input";
import { useMemo } from "react";

type FormInputs = ExternalDataSourceInput

export function UpdateExternalDataSourceFields ({
  initialData,
  crmType,
  fieldDefinitions,
  onSubmit,
  dataType
}: {
  onSubmit: (
    data: ExternalDataSourceInput,
    e?: React.BaseSyntheticEvent<object, any, any> | undefined
  ) => void;
  crmType: CrmType;
  initialData?: ExternalDataSourceInput;
  fieldDefinitions?: FieldDefinition[] | null;
  dataType: DataSourceType;
}) {
  const form = useForm<FormInputs>({
    defaultValues: initialData
  });

  function FPreopulatedSelectField ({
    name,
    label,
    placeholder,
    required = false
  }: {
    name: FieldPath<FormInputs>,
    label?: string,
    placeholder?: string
    required?: boolean
  }) {
    return (
      <PreopulatedSelectField
        name={name}
        label={label}
        placeholder={placeholder}
        fieldDefinitions={fieldDefinitions}
        control={form.control}
        crmType={crmType}
        required={required}
      />
    )
  }

  const collectFields = useMemo(() => {
    return getFieldsForDataSourceType(dataType)
  }, [dataType])

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid sm:grid-cols-2 gap-4 max-w-lg"
      >
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
                      <SelectValue placeholder={`Choose ${form.watch('geographyColumnType') || 'geography'} field`} />
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
                  <Input {...field} required={required} />
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
                      <SelectItem value={GeographyTypes.Postcode}>Postcode</SelectItem>
                      <SelectItem value={GeographyTypes.Ward}>Ward</SelectItem>
                      <SelectItem value={GeographyTypes.Council}>Council</SelectItem>
                      <SelectItem value={GeographyTypes.Constituency}>Constituency</SelectItem>
                      <SelectItem value={GeographyTypes.Address}>Address</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {collectFields?.map((field) => (
          <FPreopulatedSelectField key={field} name={field} />
        ))}
        <Button type='submit' className='mt-4'>Save settings</Button>
      </form>
    </FormProvider>
  )
}


export function getFieldsForDataSourceType (type?: DataSourceType): Array<keyof Omit<ExternalDataSourceInput, (
  'autoImportEnabled' |
  'autoUpdateEnabled' |
  'dataType' |
  'description' |
  'id' |
  'name' |
  'organisation' |
  'updateMapping' |
  'geographyColumn' |
  'geographyColumnType'
)>> {
  switch (type) {
    case DataSourceType.Member:
      return [
        "emailField",
        "phoneField",
        "addressField",
        "fullNameField",
        "firstNameField",
        "lastNameField",
      ]
    case DataSourceType.Location:
      return [
        "titleField",
        "descriptionField",
        "addressField",
        "imageField",
        "publicUrlField",
        "emailField",
        "phoneField",
      ]
    case DataSourceType.Event:
      return [
        "titleField",
        "descriptionField",
        "addressField",
        "imageField",
        "publicUrlField",
        "startTimeField",
        "endTimeField",
        "emailField",
        "phoneField",
      ]
    case DataSourceType.Story:
      return [
        "titleField",
        "descriptionField",
        "imageField",
        "publicUrlField",
      ]
    default:
      return [
        "titleField",
        "descriptionField",
        "addressField",
        "imageField",
        "publicUrlField",
      ]
  }
}