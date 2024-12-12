import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { isConstituencyPanelOpenAtom } from '@/lib/map'
import { MixerHorizontalIcon } from '@radix-ui/react-icons'
import { useAtomValue } from 'jotai'
import React from 'react'
import { NAVBAR_HEIGHT } from './ReportNavbar'
import ReportConfigLegacyControls from './_ReportConfigLegacyControls'

const ReportDisplaySettings: React.FC = () => {
  const isConstituencyPanelOpen = useAtomValue(isConstituencyPanelOpenAtom)

  return (
    <div
      id="report-display-settings"
      style={{
        top: NAVBAR_HEIGHT,
        right: isConstituencyPanelOpen ? '400px' : '15px',
        // right: 'calc(var(--sidebar-width) + 15px)',
      }}
      className="fixed z-10 pt-5"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="muted">
            <MixerHorizontalIcon />
            Display
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end">
          <ReportConfigLegacyControls />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default ReportDisplaySettings
