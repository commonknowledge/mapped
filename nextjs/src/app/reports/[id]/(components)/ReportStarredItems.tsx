import { Button } from '@/components/ui/button'
import { ExplorerState, useExplorer } from '@/lib/map/useExplorer'
import { MapPinIcon, X } from 'lucide-react'

import { DataSourceTypeIcon } from '@/components/icons/DataSourceType'
import { useReport } from '@/lib/map/useReport'
import { StarFilledIcon } from '@radix-ui/react-icons'
import { StarredState } from '../reportContext'
export default function ReportStarredItems() {
  return (
    <div className="flex flex-col gap-2 text-white">
      <span className="text-md font-medium mt-2 mb-3">Starred</span>
      <StarredItemsList />
    </div>
  )
}

export function StarredItemsList() {
  const { report, removeStarredItem } = useReport()
  const starredItems = report?.displayOptions?.starred || []

  const explorer = useExplorer()

  function handleStarredItemClick(item: ExplorerState) {
    const entity = item.entity
    const id = item.id

    // this is reloading the page for some reason so i'm using the setExplorerState hook
    // exploreArea(id)
    explorer.select(
      {
        entity,
        id,
        showExplorer: true,
      },
      {
        bringIntoView: true,
      }
    )
  }
  return (
    <div>
      {Object.keys(starredItems)?.length === 0 ? (
        <div className="text-gray-400 ">No starred items yet</div>
      ) : (
        Object.values(starredItems)?.map((item) => (
          <div
            key={item.id}
            className="flex cursor-pointer hover:bg-meepGray-500 items-center justify-between p-2 rounded-md text-sm group"
            onClick={() => handleStarredItemClick(item)}
          >
            <div className="flex items-center gap-2 ">
              <StarredItemIcon starredItem={item} />
              <span>{item.name}</span>
            </div>
            <Button
              onClick={() => removeStarredItem(item)}
              variant="ghost"
              className="text-meepGray-200 p-0 h-3 opacity-40"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))
      )}
    </div>
  )
}

function StarredItemIcon({
  starredItem,
  className,
}: {
  starredItem: StarredState
  className?: string
}) {
  return (
    <DataSourceTypeIcon
      dataType={starredItem.icon}
      defaultIcon={starredItem.entity === 'area' ? MapPinIcon : StarFilledIcon}
      className={className}
    />
  )
}
