import {
  SpecificViewConfig,
  ViewConfig,
  ViewType,
} from '@/app/reports/[id]/reportContext'
import { useReport } from '@/lib/map/useReport'
import { produce } from 'immer'
import { useQueryState } from 'nuqs'

export function useView<HookVT extends ViewType = any>(
  desiredViewType?: HookVT
) {
  const { report, updateReport } = useReport()
  const [userSelectedCurrentViewId, __setCurrentViewId] = useQueryState(
    'view',
    {
      defaultValue: '',
      clearOnDefault: true,
    }
  )

  const defaultViewIfNoValidID = Object.values(report.displayOptions.views)[0]

  const currentView: undefined | ViewConfig =
    (userSelectedCurrentViewId
      ? report.displayOptions.views[userSelectedCurrentViewId]
      : report.displayOptions.views[report.displayOptions.viewSortOrder[0]]) ||
    defaultViewIfNoValidID

  const defaultViewIfNoValidIDOfType = desiredViewType
    ? defaultViewIfNoValidID.type === desiredViewType
      ? (defaultViewIfNoValidID as SpecificViewConfig<HookVT>)
      : undefined
    : undefined

  const currentViewOfType = desiredViewType
    ? currentView && currentView.type === desiredViewType
      ? (currentView as SpecificViewConfig<HookVT>) ||
        defaultViewIfNoValidIDOfType
      : undefined
    : undefined

  return {
    currentView,
    currentViewOfType,
    setCurrentViewId,
    updateView,
    reset,
  }

  function reset() {
    __setCurrentViewId('')
  }

  function setCurrentViewId(id: string) {
    __setCurrentViewId(id)
  }

  function updateView(cb: (draft: SpecificViewConfig<HookVT>) => void) {
    if (currentView && currentView.type === desiredViewType) {
      updateReport((draft) => {
        draft.displayOptions.views[currentView.id] = produce(currentView, cb)
      })
    }
  }
}
