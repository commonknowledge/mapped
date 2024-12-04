'use client'

import { gql, useMutation } from '@apollo/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { SubmitHandler, useForm } from 'react-hook-form'
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
import { login } from '@/lib/actions/auth'

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      errors
      success
      token {
        token
        payload {
          exp
        }
      }
    }
  }
`

export default function LoginForm() {
  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    resolver: zodResolver(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    ),
  })

  const [doLogin, { data, loading, error: gqlError }] =
    useMutation(LOGIN_MUTATION)

  const token = data?.tokenAuth?.token?.token
  const authError = data?.tokenAuth?.errors
  if (token) {
    login(token, data?.tokenAuth?.token?.payload?.exp)
  }

  let errorMessage = ''
  if (gqlError) {
    errorMessage = 'Login request failed'
  }
  if (authError) {
    errorMessage = 'Bad credentials or user not verified'
  }

  const handleSubmit: SubmitHandler<any> = async (values: any, e) => {
    e?.preventDefault()
    doLogin({ variables: values })
  }

  return (
    <Form {...form}>
      <form
        className="pb-4 flex flex-col space-y-5"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  placeholder="username"
                  {...field}
                  autoComplete="username"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="password"
                  {...field}
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormMessage />
        <Button
          variant="reverse"
          type="submit"
          disabled={loading || token}
          className="flex items-center justify-center"
        >
          {loading || token ? <>Loading...</> : 'Login'}
        </Button>
        {errorMessage && <small className="text-red-500">{errorMessage}</small>}
      </form>
    </Form>
  )
}
