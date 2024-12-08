import { Metadata } from 'next'
import React from 'react'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

export const metadata: Metadata = {
  title: 'Near Me',
}
