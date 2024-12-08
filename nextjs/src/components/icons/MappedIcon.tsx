'use client'

interface MappedIconProps {
  height?: number
}

export function MappedIcon({ height = 43 }: MappedIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height={height}
      viewBox="0 0 29 43"
      fill="none"
    >
      <circle cx="14.7351" cy="14.2833" r="13.9737" fill="#678DE3" />
      <path
        d="M16.3481 39.9C15.6435 41.1625 13.8271 41.1625 13.1226 39.9L2.23064 20.3842C1.54355 19.153 2.43356 17.6371 3.84342 17.6371L25.6273 17.6371C27.0371 17.6371 27.9271 19.1531 27.24 20.3842L16.3481 39.9Z"
        fill="#678DE3"
      />
    </svg>
  )
}
