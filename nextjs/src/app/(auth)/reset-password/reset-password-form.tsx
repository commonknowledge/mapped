'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
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

const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($email: String!) {
    requestPasswordReset(email: $email) {
      errors
      success
    }
  }
`

export default function PasswordResetForm() {
  const form = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email(),
      })
    ),
    defaultValues: {
      email: '',
    },
  })

  const [requestPasswordReset, { data, loading, error: gqlError }] =
    useMutation(RESET_PASSWORD_MUTATION)
  const success = data?.requestPasswordReset?.success
  const resetError = data?.requestPasswordReset?.errors

  let message = ''
  if (gqlError) {
    message = 'Request failed, please try again later.'
  } else if (resetError && resetError.length) {
    message = resetError.join(', ')
  } else if (success) {
    message =
      'A reset link has been sent to your email address. Please check your inbox.'
  }
  const handleSubmit = async (values: any) => {
    if (form.formState.errors.email) {
      return // Prevent form submission
    }
    await requestPasswordReset({ variables: values })
  }

  return (
    <Form {...form}>
      <form
        className="pb-4 flex flex-col space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              {form.formState.errors.email && (
                <p className="text-descructive">
                  {String(form.formState.errors.email?.message || '')}
                </p>
              )}
              <FormMessage
                className={
                  message.includes('A reset link has been sent')
                    ? 'text-meepGray-100'
                    : ''
                }
              >
                {message}
              </FormMessage>
            </FormItem>
          )}
        />
        {!success && (
          <Button variant="reverse" type="submit" disabled={loading}>
            Send Reset Link
          </Button>
        )}{' '}
      </form>
    </Form>
  )
}
