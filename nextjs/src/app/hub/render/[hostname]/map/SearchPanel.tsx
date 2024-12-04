import { Plus } from 'lucide-react'
import Link from 'next/link'
import { FormEvent } from 'react'

import { useHubRenderContext } from '@/components/hub/HubRenderContext'
import { Button } from '@/components/ui/button'

export function SearchPanel({
  onSearch,
  isLoading,
  postcode,
  setPostcode,
}: {
  onSearch: (postcode: string) => void
  isLoading: boolean
  postcode: string
  setPostcode: React.Dispatch<React.SetStateAction<string>>
}) {
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const sanitisedPostcode = postcode.replace(/([\s ]*)/gim, '').trim()
    onSearch(sanitisedPostcode)
  }

  const hub = useHubRenderContext()

  if (hub.isPeopleClimateNature) {
    const disabled = !postcode || isLoading
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex gap-4">
          <div className="md:hidden flex flex-col bg-meepGray-100 py-1 px-4 text-center rounded">
            <span>OCT</span>
            <span className="text-2xl">12</span>
          </div>
          <h1 className="text-2xl md:text-4xl tracking-tight ">
            Pledge to take part in Common Grounds
          </h1>
        </div>
        <p className="text-[17px] md:text-lg leading-tight text-hub-primary-neutral text-meepGray-500">
          We are inviting as many people and communities as possible across the
          UK to meet with their MP in their local area.
        </p>
        <p className="text-[17px] md:text-lg leading-tight text-hub-primary-neutral text-meepGray-500">
          Through personal stories and discussions about the issues that matters
          most, we aim to inspire MPs to champion nature and climate issues
          alongside us.
        </p>
        <p className="text-[17px] md:text-lg leading-tight text-hub-primary-neutral text-meepGray-500">
          Enter your postcode to find your MP and pledge to meet with them on 12
          October.
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="postcode" className="text-meepGray-500">
            Your postcode
          </label>
          <input
            id="postcode"
            type="text"
            autoComplete="postal-code"
            className="mt-2 p-4 text-lg w-full rounded-md border focus:ring-hub-primary-600 border-hub-primary-100 active:border-hub-primary-500"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase())}
          />
          <button
            className={`bg-hub-primary-600 text-white text-lg font-bold rounded-md w-full p-4 mt-4 ${!disabled ? 'hover:bg-hub-primary-700 focus:bg-hub-primary-700' : ''}`}
            // TODO: add postcode validation
            disabled={disabled}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>
    )
  } else {
    // Unbranded
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className="text-2xl md:text-4xl tracking-tight mb-4 text-hub-primary-500">
          Upcoming events
        </h1>
        <p className="text-lg leading-tight text-hub-primary-neutral">
          Explore our map of upcoming events happening all over the UK or search
          your postcode to see what{'’'}s happening near you.
        </p>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="postcode"
            autoComplete="postal-code"
            className="p-4 text-lg w-full rounded-md border placeholder:text-hub-primary-600 focus:ring-hub-primary-600 bg-hub-primary-50 border-hub-primary-100 mt-4 active:border-hub-primary-500"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value.toUpperCase().trim())}
          />
          <button
            className="bg-hub-primary-600 text-white text-lg font-bold rounded-md w-full p-4 mt-4"
            // TODO: add postcode validation
            disabled={!postcode || isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
      </div>
    )
  }
}

export function HustingsCTA() {
  return (
    <>
      <p>Running your own hustings event? Add it to our map</p>
      <Link
        href="https://docs.google.com/forms/d/e/1FAIpQLSeQ6L2fko9q1xNvEYt0ZNbIIPDNAq6cs93Pn2Vx8ARtMf6FIg/viewform"
        target="_blank"
        className=""
      >
        <Button className="bg-white border border-hub-primary-600 text-hub-primary-600 gap-2 hover:bg-hub-primary-50">
          <Plus />
          Add Event
        </Button>
      </Link>
    </>
  )
}
