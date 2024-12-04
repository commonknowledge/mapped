'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function NotFound() {
  return (
    <div className="absolute w-full h-full">
      <div className="flex flex-col items-center justify-center w-full h-full">
        <Card className="p-4 bg-white border-1 border-meepGray-700 text-meepGray-800">
          <CardHeader>
            <CardTitle className="text-hMd grow font-IBMPlexSansMedium">
              Report not found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              The report you are looking for does not exist.
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
