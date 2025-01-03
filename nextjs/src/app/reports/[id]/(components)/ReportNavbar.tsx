import ReportActions from '@/app/reports/[id]/(components)/ReportActions'
import { useReport } from '@/app/reports/[id]/(components)/ReportProvider'
import { useSidebar } from '@/components/ui/sidebar'

import { contentEditableMutation } from '@/lib/html'
import { atom, useAtomValue } from 'jotai'
import { PanelRight } from 'lucide-react'
import Link from 'next/link'
import { MappedIcon } from '../../../../components/icons/MappedIcon'

// You can set the title & href of the top left icon link based on route & context
export const navbarTitleAtom = atom('')
export const NAVBAR_HEIGHT = 48

export default function ReportNavbar() {
  const title = useAtomValue(navbarTitleAtom)
  const { updateReport } = useReport()
  const { toggleSidebar } = useSidebar()

  return (
    <nav
      style={{ height: NAVBAR_HEIGHT.toString() + 'px' }}
      className="fixed top-0 left-0 w-full bg-meepGray-600 flex flex-row items-center
     justify-between px-4 shadow-md z-10 border border-b-meepGray-800"
    >
      <section className="flex flex-row items-center gap-2">
        <Link href="/reports" className="py-sm">
          <MappedIcon height={20} />
        </Link>
        <div
          className="text-white text-lg font-bold font-IBMPlexSans"
          {...contentEditableMutation(updateReport, 'name', 'Untitled Report')}
        >
          {title}
        </div>
        <div className="flex gap-8 items-center">
          <ReportActions />
          <PanelRight
            onClick={toggleSidebar}
            className="text-meepGray-400 w-4 h-4 cursor-pointer"
          />{' '}
        </div>
      </section>
      <section className="flex space-x-4"> </section>
    </nav>
  )
}
