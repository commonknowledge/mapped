'use client'

import { OperationVariables, gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const PERFORM_PASSWORD_RESET_MUTATION = gql`
  mutation PerformPasswordReset(
    $token: String!
    $password1: String!
    $password2: String!
  ) {
    performPasswordReset(
      token: $token
      newPassword1: $password1
      newPassword2: $password2
    ) {
      errors
      success
    }
  }
`

export default function NewPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const passwordSchema = z
    .object({
      password1: z
        .string()
        .min(8)
        .regex(
          new RegExp(
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
          ),
          {
            message:
              'Your password must include at least one uppercase letter, one lowercase letter, one number and one special character, and be at least 8 characters long.',
          }
        ),
      password2: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' }),
    })
    .refine((data) => data.password1 === data.password2, {
      message: 'Passwords must match.',
      path: ['password2'],
    })

  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password1: '',
      password2: '',
    },
  })

  const [messageType, setMessageType] = useState('')

  const handleCompleted = (data: {
    performPasswordReset: { success: any }
  }) => {
    const success = data?.performPasswordReset?.success
    if (success) {
      form.reset()
      setMessageType('success')
    } else {
      setMessageType('error')
    }
  }

  const handleError = () => {
    setMessageType('error')
  }

  const [performPasswordReset, { loading }] = useMutation(
    PERFORM_PASSWORD_RESET_MUTATION,
    {
      onCompleted: handleCompleted,
      onError: handleError,
    }
  )

  const handleSubmit = async (values: OperationVariables | undefined) => {
    await performPasswordReset({ variables: { ...values, token } })
  }

  return (
    <Form {...form}>
      <form
        className="pb-4 flex flex-col space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="password1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  {...field}
                />
              </FormControl>
              {form.formState.errors.password1 && (
                <p className="text-destructive">
                  {String(form.formState.errors.password1?.message || '')}
                </p>
              )}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  {...field}
                />
              </FormControl>
              {form.formState.errors.password2 && (
                <p className="text-destructive">
                  {String(form.formState.errors.password2?.message || '')}
                </p>
              )}
            </FormItem>
          )}
        />

        {messageType === 'success' ? (
          <FormMessage className="text-meepGray-100">
            <span>Password reset successfully! You can now</span>
            <a href="/login"> login</a>
            <span>.</span>
          </FormMessage>
        ) : messageType === 'error' ? (
          <FormMessage>
            <span>
              Could not reset your password. Please try again, or request a new
              reset email.
            </span>
          </FormMessage>
        ) : (
          <Button variant="reverse" type="submit" disabled={loading}>
            Reset Password
          </Button>
        )}
      </form>
    </Form>
  )
}
