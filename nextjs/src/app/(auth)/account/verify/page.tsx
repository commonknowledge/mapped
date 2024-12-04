'use client'

import { gql, useMutation } from '@apollo/client'
import { useEffect } from 'react'

import { clearJwt } from '@/lib/actions/auth'

const VERIFY_ACCOUNT = gql`
  mutation Verify($token: String!) {
    verifyAccount(token: $token) {
      errors
      success
    }
  }
`

export default function Verify() {
  const [doVerify, { data, error }] = useMutation(VERIFY_ACCOUNT)

  useEffect(() => {
    clearJwt() // Clear existing JWT in case user was logged in as someone else
    const urlParams = new URLSearchParams(
      typeof window === 'undefined' ? '' : window.location.search
    )
    const token = urlParams.get('token')
    doVerify({ variables: { token } })
  }, [doVerify])

  const response = data?.verifyAccount
  const success =
    response?.success ||
    response?.errors?.nonFieldErrors[0]?.code === 'already_verified'

  if (success) {
    // Use a normal <a> here to fix weird behavior if the user was already logged in
    return (
      <h2>
        Verified! You may now{' '}
        <a className="underline" href="/login">
          log in.
        </a>
      </h2>
    )
  }

  if (error || data?.verifyAccount?.errors) {
    return <h2>Could not verify your account, please try again later.</h2>
  }

  return <h2>Loading...</h2>
}
