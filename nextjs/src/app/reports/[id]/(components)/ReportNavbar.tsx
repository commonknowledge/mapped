import ReportActions from '@/app/reports/[id]/(components)/ReportActions'
import { useReport } from '@/app/reports/[id]/(components)/ReportProvider'
import { useSidebar } from '@/components/ui/sidebar'
import { useParams, usePathname } from 'next/navigation'

import { contentEditableMutation } from '@/lib/html'
import { atom, useAtomValue } from 'jotai'
import { BarChartIcon, MapIcon, PanelRight } from 'lucide-react'
import Link from 'next/link'
import { MappedIcon } from '../../../../components/icons/MappedIcon'

type Params = {
  id: string
}

const activeTabAtom = atom('map')

// You can set the title & href of the top left icon link based on route & context
export const navbarTitleAtom = atom('')
export const NAVBAR_HEIGHT = 48

export default function ReportNavbar() {
  const pathname = usePathname()
  const params = useParams()
  const id = params.id
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
        <div className="flex flex-row items-center gap-2 px-10">
          {navbarTabs(id as string).map((tab) => (
            <Link href={tab.href} key={tab.name}>
              <div
                className={`py-1 px-2 font-normal flex flex-row items-center gap-2 rounded-md ${
                  pathname === tab.href
                    ? 'bg-meepGray-800 opacity-100'
                    : 'hover:bg-meepGray-800 opacity-50'
                }`}
              >
                {tab.icon}
                {tab.name}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="flex space-x-4"></section>
    </nav>
  )
}

function navbarTabs(id: string) {
  return [
    {
      name: 'Map',
      href: `/reports/${id}`,
      icon: <MapIcon className="w-4 h-4" />,
    },
    {
      name: 'Dashboard',
      href: `/reports/${id}/dashboard`,
      icon: <BarChartIcon className="w-4 h-4" />,
    },
  ]
}
