import Link from 'next/link'
import { ReactNode } from 'react'

import { buttonVariants } from '../ui/button'

interface TemplateTextBlock {
  labelHeading?: string
  heading: ReactNode
  description: string
  btnText?: string
  btnLink?: string
  center?: boolean
}

const TemplateTextBlock: React.FC<TemplateTextBlock> = ({
  labelHeading,
  heading,
  description,
  btnLink,
  btnText,
  center,
}) => {
  return center ? (
    <div className="flex flex-col gap-2 shrink items-center p-10 pr-14 text-center">
      {labelHeading ? (
        <p className="text-meepGray-200 text-labelXlg">{labelHeading}</p>
      ) : null}
      <h1 className="text-hLg font-IBMPlexSansCondensed mb-10 text-white">
        {heading}
      </h1>
      <p className="text-meepGray-200 max-w-prose">{description}</p>
      {btnLink ? (
        <div className="mt-10">
          <Link
            href={btnLink}
            className={buttonVariants({ variant: 'secondary' })}
          >
            {btnText}
          </Link>
        </div>
      ) : null}
    </div>
  ) : (
    <div className="flex flex-col gap-2 shrink items-start p-10 pr-14">
      {labelHeading ? (
        <p className="text-meepGray-200 text-labelXlg">{labelHeading}</p>
      ) : null}
      <h1 className="text-hLg font-IBMPlexSansCondensed mb-10 text-white">
        {heading}
      </h1>
      <p className="text-meepGray-200 max-w-prose">{description}</p>
      {btnLink ? (
        <div className="mt-8">
          <Link
            href={btnLink}
            className={buttonVariants({ variant: 'secondary' })}
          >
            {btnText}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

export default TemplateTextBlock
