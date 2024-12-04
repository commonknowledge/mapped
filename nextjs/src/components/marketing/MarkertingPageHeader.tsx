import Link from 'next/link'
import { ReactNode } from 'react'

import { buttonVariants } from '../ui/button'

interface MarkertingPageHeaderProps {
  labelHeading?: string
  heading: ReactNode
  description: string
  btnText: string
  btnLink: string
}

const MarketingPageHeader: React.FC<MarkertingPageHeaderProps> = ({
  labelHeading,
  heading,
  description,
  btnLink,
  btnText,
}) => {
  return (
    <header className="flex flex-col gap-5 items-center shrink text-center md:p-10 p-4 max-w-4xl mb-20">
      <p className="text-meepGray-200 text-labelXlg">{labelHeading}</p>
      <h1 className="md:text-hXlg text-hLg font-light font-IBMPlexSansLight">
        {heading}
      </h1>
      <p className="text-meepGray-200 max-w-prose mb-4">{description}</p>
      {btnLink ? (
        <Link href={btnLink} className={buttonVariants({ variant: 'brand' })}>
          {btnText}
        </Link>
      ) : null}
    </header>
  )
}

export default MarketingPageHeader
