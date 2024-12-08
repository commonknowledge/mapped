'use client'

import { ClipboardCopy, Plus, Shuffle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import React from 'react'
import { useReport } from './ReportProvider'

const ReportConfigLegacyControls: React.FC = () => {
  const {
    updateReport,
    report: {
      organisation,
      displayOptions: {
        display: { showLastElectionData, showMPs, showStreetDetails } = {},
      },
    },
  } = useReport()

  const shareURL = () =>
    new URL(
      `/data-sources/share/${organisation.slug}`,
      window.location.toString()
    ).toString()

  const toggleElectionData = () => {
    updateReport({
      displayOptions: {
        display: {
          showLastElectionData: !showLastElectionData,
        },
      },
    })
  }

  const toggleMps = () => {
    updateReport({
      displayOptions: {
        display: {
          showMPs: !showMPs,
        },
      },
    })
  }

  return (
    <div className="bg-meepGray-700 p-3">
      <div className="p-3 pb-4 flex flex-col gap-2 border-t border-meepGray-700 ">
        <span className="label mb-2 text-labelLg text-meepGray-200">
          Map settings
        </span>

        <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
          <Switch
            checked={showStreetDetails}
            onCheckedChange={(showStreetDetails: boolean) => {
              // @ts-ignore: Property 'showStreetDetails' does not exist on type 'DeepPartialObject'
              updateReport({
                displayOptions: { display: { showStreetDetails } },
              })
            }}
          />
          Street details
        </div>
      </div>
      <div className="p-3 pb-4 flex flex-col gap-2 border-t border-meepGray-700 ">
        <span className="label mb-2 text-labelLg text-meepGray-200">
          Westminster politics
        </span>
        <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
          <Switch checked={showMPs} onCheckedChange={toggleMps} />
          Current MP
        </div>
        <div className="text-labelLg text-meepGray-200 flex items-center gap-2">
          <Switch
            checked={showLastElectionData}
            onCheckedChange={toggleElectionData}
          />
          Last GE election results
        </div>
      </div>
      <CardHeader>
        <h2 className="text-meepGray-400 flex flex-row gap-1 items-center text-sm">
          <Shuffle className="w-4" /> Collaborative area
        </h2>
      </CardHeader>
      <CardContent>
        <p className="text-meepGray-300 text-xs py-4">
          Invite to organisations to share membership lists and collaborate on a
          campaign together.
        </p>
        <div className="flex gap-2 items-center">
          <Dialog>
            <DialogTrigger asChild>
              <Button size={'sm'} variant="outline" className="text-sm">
                <Plus /> Invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Request data from other campaigns</DialogTitle>
                <DialogDescription>
                  Share this URL to request data from other campaigns. They
                  {"'"}ll be able to pick and choose which data sources to share
                  with you, with some data privacy options.
                </DialogDescription>
              </DialogHeader>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input value={shareURL()} />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(shareURL())
                    toast.success('Copied to clipboard')
                  }}
                >
                  <ClipboardCopy />
                </Button>
              </div>
              <DialogFooter>
                <DialogClose
                  onClick={() => {
                    navigator.clipboard.writeText(shareURL())
                    toast.success('Copied to clipboard')
                  }}
                >
                  Copy and close
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </div>
  )
}

export default ReportConfigLegacyControls
