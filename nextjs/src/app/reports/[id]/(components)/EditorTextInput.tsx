import { Input } from '@/components/ui/input'
import { ChangeEventHandler, FocusEventHandler } from 'react'
import { EditorField, EditorFieldProps } from './EditorField'

export function EditorTextInput({
  value,
  onChange,
  onBlur,
  disabled,
  disabledMessage,
  valueClassName,
  inputProps,
  ...fieldProps
}: {
  value?: string | null
  onChange: ChangeEventHandler<HTMLInputElement>
  onBlur?: FocusEventHandler<HTMLInputElement>
  disabled?: boolean
  disabledMessage?: string
  valueClassName?: string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
} & EditorFieldProps) {
  return (
    <EditorField {...fieldProps}>
      <Input
        className="text-xs h-6"
        value={value === null ? undefined : value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        {...inputProps}
      />
    </EditorField>
  )
}
