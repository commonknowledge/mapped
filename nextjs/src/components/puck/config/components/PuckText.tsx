import { twMerge } from 'tailwind-merge'

export function PuckText({
  text,
  className,
}: {
  text?: string
  className?: string
}) {
  return (
    <>
      {text?.split('\n\n').map((para, i) => (
        <p key={i} className={twMerge('mb-2', className)}>
          {para}
        </p>
      ))}
    </>
  )
}
