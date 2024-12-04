'use client'

import { MouseEvent } from 'react'

import { logout } from '@/lib/actions/auth'

export default function LogoutForm() {
  const handleLogout = (e: MouseEvent) => {
    e.preventDefault()
    logout()
  }

  return (
    <>
      <h1 className="pb-4">Logout from Mapped</h1>
      <button
        className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
        onClick={handleLogout}
        type="button"
      >
        Logout
      </button>
    </>
  )
}
