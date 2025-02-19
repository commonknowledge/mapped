import ReportActions from '@/app/reports/[id]/(components)/ReportActions'
import { useReport } from '@/lib/map/useReport'

import { ViewCreator } from '@/components/report/ViewCreator'
import { dataTypeDisplay, ViewIcon } from '@/components/report/ViewIcon'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { contentEditableMutation } from '@/lib/html'
import { useSidebarLeftState } from '@/lib/map'
import { useExplorer } from '@/lib/map/useExplorer'
import { useView } from '@/lib/map/useView'
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  restrictToHorizontalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers'
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { atom, useAtomValue } from 'jotai'
import { cloneDeep } from 'lodash'
import { PanelLeft, PanelRight } from 'lucide-react'
import Link from 'next/link'
import { CSSProperties } from 'react'
import { twMerge } from 'tailwind-merge'
import { v4 } from 'uuid'
import { MappedIcon } from '../../../../components/icons/MappedIcon'
import ReportStarredItemsDropdown from '../../ReportStarredItemsDropdown'
import { ViewConfig, ViewType } from '../reportContext'
import MapComboBox from './AreaComboBox/MapComboBox'
import TableComboBox from './AreaComboBox/TableComboBox'

// You can set the title & href of the top left icon link based on route & context
export const navbarTitleAtom = atom('')
export const NAVBAR_HEIGHT = 48

export default function ReportNavbar() {
  const title = useAtomValue(navbarTitleAtom)
  const { updateReport, report } = useReport()
  const leftSidebar = useSidebarLeftState()
  const explorer = useExplorer()
  const viewManager = useView()
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15,
      },
    })
  )

  if (!report) return

  return (
    <nav
      className="fixed top-0 left-0 w-full bg-meepGray-600 grid gap-1 items-center
     justify-between px-4 shadow-md z-10 border border-b-meepGray-800"
      style={{
        height: NAVBAR_HEIGHT.toString() + 'px',
        // Three columns: 18rem, 1fr, remainder/noshrink
        gridTemplateColumns: 'minmax(0, 18rem) 1fr min-content',
      }}
    >
      <section className="flex flex-row items-center gap-1">
        <Link href="/reports">
          <MappedIcon height={20} />
        </Link>
        <div
          className="text-white text-lg font-bold font-IBMPlexSans truncate"
          {...contentEditableMutation(
            (name) =>
              updateReport((d) => {
                d.name = name
              }),
            'Untitled Report'
          )}
        >
          {title}
        </div>
        <ReportActions />
        <Button variant="ghost" size="sm" onClick={leftSidebar.toggle}>
          <PanelLeft className="text-meepGray-400 w-4 h-4 cursor-pointer shrink-0" />
        </Button>
      </section>
      <section
        className={twMerge(
          'grid grid-flow-col items-center gap-1',
          // If too many tabs, smaller text
          report.displayOptions.viewSortOrder.length > 5
            ? 'text-sm'
            : 'text-base'
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToParentElement, restrictToHorizontalAxis]}
          onDragEnd={({ active, over }) => {
            if (!!over && active.id !== over.id) {
              updateReport((draft) => {
                const oldIndex = draft.displayOptions.viewSortOrder.indexOf(
                  String(active.id)
                )
                const newIndex = draft.displayOptions.viewSortOrder.indexOf(
                  String(over.id)
                )
                draft.displayOptions.viewSortOrder = arrayMove(
                  draft.displayOptions.viewSortOrder,
                  oldIndex,
                  newIndex
                )
              })
            }
          }}
        >
          <SortableContext
            items={report.displayOptions.viewSortOrder}
            strategy={horizontalListSortingStrategy}
          >
            {report.displayOptions.viewSortOrder
              .map((viewId) => report.displayOptions.views[viewId])
              .filter(Boolean)
              .map((view) => (
                <SortableViewTabItem key={view.id} view={view} />
              ))}
          </SortableContext>
        </DndContext>
      </section>
      <section className="flex flex-row items-center">
        <ViewCreator />
        {viewManager.currentView?.type === ViewType.Map ? (
          <MapComboBox />
        ) : viewManager.currentView?.type === ViewType.Table ? (
          <TableComboBox />
        ) : null}
        <ReportStarredItemsDropdown />
        {/* {!!explorer.isValidEntity(explorer.state) && ( */}
        <Button variant="ghost" size="sm" onClick={explorer.toggle}>
          <PanelRight className="text-meepGray-400 w-4 h-4 cursor-pointer" />
        </Button>
        {/* )} */}
      </section>
    </nav>
  )
}

function SortableViewTabItem({ view }: { view: ViewConfig }) {
  const reportManager = useReport()
  const viewManager = useView()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: view.id })

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: isDragging ? 'relative' : 'inherit',
    zIndex: isDragging ? 1000 : 0,
  }

  return (
    <ContextMenu key={view.id}>
      <ContextMenuTrigger asChild>
        <div
          onClick={() => viewManager.setCurrentViewId(view.id)}
          className={'py-1 truncate overflow-ellipsis overflow-hidden'}
          style={style}
          ref={setNodeRef}
          {...attributes}
          {...listeners}
        >
          <div
            className={twMerge(
              'w-full px-2 py-1 rounded-md cursor-pointer flex items-center justify-center gap-1 h-full bg-meepGray-600',
              view.id === viewManager.currentView?.id
                ? 'text-white bg-meepGray-800'
                : 'text-meepGray-400 bg-black bg-opacity-10'
            )}
          >
            <ViewIcon viewType={view.type} className="shrink-0" />
            <div
              {...contentEditableMutation((name) => {
                reportManager.updateReport((d) => {
                  d.displayOptions.views[view.id].name = name
                })
              })}
            >
              {view.name || dataTypeDisplay[view.type].defaultName}
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            reportManager.updateReport((draft) => {
              const id = v4()
              draft.displayOptions.views[id] = cloneDeep(view)
              draft.displayOptions.views[id].id = id
              draft.displayOptions.views[id].name = `${view.name} (Copy)`
            })
          }}
        >
          Duplicate
        </ContextMenuItem>
        {Object.values(reportManager.report?.displayOptions.views || {})
          .length > 1 && (
          <ContextMenuItem
            onClick={() => {
              reportManager.updateReport((draft) => {
                if (draft.displayOptions.views[view.id]) {
                  delete draft.displayOptions.views[view.id]
                } else {
                  const id = Object.entries(draft.displayOptions.views).find(
                    ([id, someView]) => someView.id === view.id
                  )?.[0]
                  if (id) delete draft.displayOptions.views[id]
                }
              })
            }}
          >
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
