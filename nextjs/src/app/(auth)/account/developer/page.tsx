'use client'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/experimental-nextjs-app-support/ssr'
import { ClipboardCopy, Trash } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import {
  CreateTokenMutation,
  CreateTokenMutationVariables,
  DeveloperApiContextQuery,
  RevokeTokenMutation,
  RevokeTokenMutationVariables,
} from '@/__generated__/graphql'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { LoadingIcon } from '@/components/ui/loadingIcon'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GRAPHQL_URL } from '@/env'
import { toastPromise } from '@/lib/toast'

const YOUR_API_TOKENS = gql`
  query DeveloperAPIContext {
    listApiTokens {
      token
      signature
      revoked
      createdAt
      expiresAt
    }
  }
`

export default function DeveloperConfig() {
  const { data, error, loading, refetch, client } =
    useQuery<DeveloperApiContextQuery>(YOUR_API_TOKENS)

  if (error && !loading) {
    return <p className="text-red-500">Error: {String(error)}</p>
  }

  if (loading || !data) {
    return <LoadingIcon />
  }

  return (
    <div>
      <h2 className="text-xl font-semibold">API Tokens</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Token</TableHead>
            <TableHead>Expiry date</TableHead>
            <TableHead colSpan={2}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.listApiTokens
            ?.filter((t) => !t.revoked)
            .map((token) => (
              <TableRow key={token.signature}>
                <TableCell className="w-3/4">
                  <Input
                    id={`input-${token.signature}`}
                    onClick={() => {
                      // highlight on click
                      const input: HTMLInputElement = document.getElementById(
                        `input-${token.signature}`
                      ) as any
                      input?.focus()
                      input?.select()
                      navigator.clipboard.writeText(token.token)
                      toast.success('Copied token to clipboard')
                    }}
                    value={token.token}
                  />
                </TableCell>
                <TableCell>
                  {new Date(token.expiresAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(token.token)
                      toast.success('Copied token to clipboard')
                    }}
                  >
                    <ClipboardCopy />
                    &nbsp;&nbsp;Copy
                  </Button>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Trash />
                        &nbsp;&nbsp;Revoke
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                      </DialogHeader>
                      <DialogFooter className="sm:justify-start">
                        <DialogClose asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            onClick={() => revoke(token.signature)}
                          >
                            Revoke token
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <Button
        className="mt-4 mb-8"
        onClick={() => {
          createToken()
        }}
      >
        Generate an API token
      </Button>

      <h2 className="text-xl font-semibold mb-3">
        How to authenticate the API
      </h2>
      <p>
        To use the API, simply make a request to{' '}
        <code className="bg-meepGray-700 p-1 rounded-lg">{GRAPHQL_URL}</code>{' '}
        and place the token in the Authorization header following {"'"}JWT{"'"},
        like so:{' '}
        <code className="bg-meepGray-700 p-1 rounded-lg">
          Authorization: {"'"}JWT eyJh...{"'"}
        </code>
        .
      </p>
      <div className="font-semibold mb-3 mt-8 underline">
        <Link href="/graphiql">Visit the API playground &rarr;</Link>
      </div>
    </div>
  )

  function createToken() {
    const createToken = client.mutate<
      CreateTokenMutation,
      CreateTokenMutationVariables
    >({
      mutation: gql`
        mutation CreateToken {
          createApiToken {
            token
            signature
            revoked
            createdAt
            expiresAt
          }
        }
      `,
    })
    toastPromise(createToken, {
      loading: 'Creating token...',
      success: () => {
        refetch()
        return 'Token has been created'
      },
      error: 'Token creation failed',
    })
  }

  function revoke(signature: string) {
    const revokeToken = client.mutate<
      RevokeTokenMutation,
      RevokeTokenMutationVariables
    >({
      mutation: gql`
        mutation RevokeToken($signature: ID!) {
          revokeApiToken(signature: $signature) {
            signature
            revoked
          }
        }
      `,
      variables: { signature },
    })
    toastPromise(revokeToken, {
      loading: 'Revoking token...',
      success: () => {
        refetch()
        return 'Token has been revoked'
      },
      error: 'Token revocation failed',
    })
  }
}
