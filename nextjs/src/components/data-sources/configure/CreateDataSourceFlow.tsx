// import { useAtom } from 'jotai'
// import { atomWithMachine } from 'jotai-xstate'
// import { createMachine } from 'xstate'

import { Button } from '@/components/ui/button'
import { useAtom } from 'jotai'
import { twMerge } from 'tailwind-merge'
import { SOURCE_SETUP_STEPS } from './screens'
import { configureDataSourceStateAtom } from './state'

export function CreateDataSourceFlow() {
  const [state, set] = useAtom(configureDataSourceStateAtom)
  const Screen =
    SOURCE_SETUP_STEPS.find((s) => s.key === (state.value as any))?.screen ||
    (() => {
      return <div>Unknown screen</div>
    })

  return (
    <main className="h-full max-h-full w-full overflow-auto flex flex-col justify-start">
      <nav className="px-4 py-4 shrink-0 grow-0 flex flex-row gap-6 items-center justify-center border-b border-meepGray-600">
        {SOURCE_SETUP_STEPS.map((step) => (
          <div
            onClick={() => set({ type: step.key })}
            className={twMerge(
              'text-meepGray-400 hover:text-meepGray-200 cursor-pointer px-3 py-1 rounded-md truncate',
              state.matches(step.key) && 'bg-meepGray-700'
            )}
          >
            {step.label}
          </div>
        ))}
      </nav>
      <div className="p-16 px-4 max-w-4xl mx-auto">
        <Screen />
      </div>
      <footer className="flex flex-row gap-2 justify-between shrink-0 grow-0 mt-auto p-4 border-t border-meepGray-600">
        <Button onClick={() => set({ type: 'back' })}>Back</Button>
        <Button onClick={() => set({ type: 'next' })}>Continue</Button>
      </footer>
    </main>
  )
}
