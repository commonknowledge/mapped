import { CSSProperties, ReactNode } from 'react'

export type SectionProps = {
  className?: string
  children: ReactNode
  padding?: string
  maxWidth?: string
  style?: CSSProperties
}

export const Section = ({
  children,
  className,
  padding = '0px',
  maxWidth = '1280px',
  style = {},
}: SectionProps) => {
  return (
    <div
      className={className}
      style={{
        ...style,
        paddingTop: padding,
        paddingBottom: padding,
      }}
    >
      <div style={{ maxWidth }}>{children}</div>
    </div>
  )
}
