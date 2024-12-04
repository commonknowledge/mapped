'use client'

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

// Disabled until we open Mapped to the public
// const REGISTER_MUTATION = gql`
//   mutation Register($email: String!, $password1: String!, $password2: String!, $username: String!) {
//     register(email: $email, password1: $password1, password2: $password2, username: $username) {
//       errors
//       success
//     }
//   }
// `;

export default function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(
      z
        .object({
          username: z.string().min(5),
          email: z.string().email(),
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
          // Make sure password2 == password1
          password2: z.string(),
        })
        .refine((data) => data.password1 === data.password2, {
          message: "Passwords don't match",
          path: ['password2'],
        })
    ),
  })

  // const [doRegister, { data, loading, error: gqlError }] = useMutation(REGISTER_MUTATION);
  const [doRegister, { data, loading, error: gqlError }] = [
    ({ variables }: { variables: any }) => {
      console.log('fake registering with', variables)
    },
    {
      data: null,
      loading: false,
      error: null,
    },
  ]

  // TODO: remove these @ts-ignores when the REGISTER_MUTATION is enabled

  // @ts-ignore
  const authError = data?.register?.errors
  // @ts-ignore
  const success = data?.register?.success

  const errors = []
  if (gqlError) {
    errors.push('Register request failed')
  }
  if (authError) {
    for (const field of Object.keys(authError)) {
      const fieldErrors = authError[field]
      for (const error of fieldErrors) {
        errors.push(error.message)
      }
    }
  }

  const handleSubmit = async (values: any) => {
    doRegister({ variables: values })
  }

  if (success) {
    return (
      <>
        <h2>Thanks for registering!</h2>
        <p>
          One last step: we{"'"}ve emailed you an activation link at the email
          address you provided.
        </p>
        <p>Once you click that link, you can log in and start using Mapped!</p>
      </>
    )
  }

  return (
    <Form {...form}>
      <form
        className="pb-4 flex flex-col space-y-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormMessage />
        <Button variant="reverse" type="submit" disabled={loading}>
          Sign up
        </Button>
      </form>
    </Form>
  )
}
