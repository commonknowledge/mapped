import Link from 'next/link'

import { CiviPowerFundLogo } from './logos/CiviPowerFundLogo'
import { CommonKnowledgeLogo } from './logos/CommonKnowledgeLogo'
import { JRRTLogo } from './logos/JRRTLogo'

export default function Footer() {
  return (
    <footer className="md:mx-16 md:py-8 flex flex-col md:flex-row justify-between md:items-center border-t border-meepGray-700">
      <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-[100px] pt-md">
        <Link href="https://commonknowledge.coop/">
          <CommonKnowledgeLogo />
        </Link>
        <Link href="https://www.civicpower.org.uk/">
          {' '}
          <CiviPowerFundLogo />
        </Link>
        <Link href="https://www.jrrt.org.uk/">
          {' '}
          <JRRTLogo />
        </Link>
      </div>
      <Link
        href="/"
        className="text-muted font-IBMPlexMono text-[15px] tracking-[-0.3px] leading-[150%]"
      >
        Privacy policy
      </Link>
    </footer>
  )
}
