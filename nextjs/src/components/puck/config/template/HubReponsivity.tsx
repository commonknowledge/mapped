import { ReactNode } from 'react'

interface HubResponsivityProps {
  children: ReactNode
}

export default function HubResponsivity({ children }: HubResponsivityProps) {
  return (
    <div className="grid md:grid-cols-4 grid-cols-1 gap-[25px] mb-[25px]">
      {children}
    </div>
  )
}
