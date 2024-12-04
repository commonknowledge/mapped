import Link from 'next/link'

import { Button } from '@/components/ui/button'

const FeedbackBanner = () => {
  return (
    <div className="bg-yellow p-xs flex justify-between items-start md:items-center">
      <p className="text-darkSecondary text-[14px] md:text-[17px] leading-[150%]">
        Mapped is currently in alpha.{' '}
        <Link className="underline" href="/about">
          Learn more about the project
        </Link>{' '}
        or{' '}
        <Link className="underline" href="https://mapped.commonknowledge.coop/">
          explore the previous version.
        </Link>
      </p>
      <Button className="bg-darkSecondary text-white text-labelLg py-[12px] hover:bg-darkSecondary">
        {' '}
        <Link href="/feedback">Submit feedback</Link>
      </Button>
    </div>
  )
}

export default FeedbackBanner
