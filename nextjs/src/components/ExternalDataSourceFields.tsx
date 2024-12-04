import { Control, FieldPath } from 'react-hook-form'
import toSpaceCase from 'to-space-case'

import { CrmType, FieldDefinition } from '@/__generated__/graphql'

import { DataSourceFieldLabel } from './DataSourceIcon'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export function PreopulatedSelectField<FormInputs extends object = any>({
  name,
  label,
  placeholder,
  fieldDefinitions,
  control,
  crmType,
  guess,
  required = false,
  helpText = '',
}: {
  name: FieldPath<FormInputs>
  label?: string
  placeholder?: string
  required?: boolean
  fieldDefinitions?: Array<FieldDefinition> | null
  control: Control<FormInputs>
  crmType: CrmType
  guess?: string | null
  helpText?: string
}) {
  const humanisedFieldName =
    label || `${toSpaceCase(name.replace(/(field)$/gi, ''))} field`
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="capitalize">{humanisedFieldName}</FormLabel>
          <FormControl>
            {fieldDefinitions?.length ? (
              // @ts-ignore
              <Select
                {...{ ...field, ref: null }}
                onValueChange={field.onChange}
                required={required}
              >
                <SelectTrigger className="pl-1">
                  <SelectValue
                    className="capitalize"
                    placeholder={placeholder || `Choose ${humanisedFieldName}`}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Available fields</SelectLabel>
                    {fieldDefinitions?.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        <DataSourceFieldLabel
                          crmType={crmType}
                          fieldDefinition={field}
                        />
                      </SelectItem>
                    ))}
                    <SelectItem
                      /* @ts-ignore */
                      value={null}
                      onClick={() => {
                        field.onChange(null)
                      }}
                    >
                      <div className="px-2">N/A</div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            ) : (
              <Input {...field} required={required} />
            )}
          </FormControl>
          {helpText && <FormDescription>{helpText}</FormDescription>}
          {!!guess && guess === field.value && (
            <FormDescription className="text-yellow-500 italic">
              Guessed based on available fields
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
