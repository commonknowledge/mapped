import { useHubRenderContext } from "@/components/hub/HubRenderContext"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { FormEvent, useState } from "react"

export function SearchPanel({
  onSearch,
  isLoading,
}: {
  onSearch: (postcode: string) => void,
  isLoading: boolean
}) {
  const [postcode, setPostcode] = useState("")
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const sanitisedPostcode = postcode.replace(/([\s ]*)/mig, "").trim()
    onSearch(sanitisedPostcode)
  }

  const hub = useHubRenderContext()


  if (hub.hostname === 'peopleclimatenature.org') {
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className='text-4xl tracking-tight mb-4 '>
          Local Climate and Nature Hustings
        </h1>
        <p className='text-lg leading-tight text-hub-primary-neutral'>
          Explore our map of Husting events happening all over the UK or input your postcode to see what{"’"}s happening near you.
        </p>
        <div className="flex flex-wrap gap-y-2">
          <div className="flex basis-1/2 gap-2 items-center"><img src={"/markers/tcc-husting.svg"}></img>Hustings</div>
          <div className="flex basis-1/2 gap-2 items-center"><img src={"/markers/tcc-canvassing.svg"}></img>Canvassing</div>
          <div className="flex basis-1/2 gap-2 items-center"><img src={"/markers/tcc-training.svg"}></img>Trainings</div>
          <div className="flex basis-1/2gap-2 items-center"><img src={"/markers/tcc-general.svg"}></img>Other/general</div>
        </div>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="postcode"
            autoComplete="postal-code"
            className='p-4 text-lg w-full rounded-md border placeholder:text-hub-primary-600 focus:ring-hub-primary-600 bg-hub-primary-50 border-hub-primary-100 mt-4 active:border-hub-primary-500'
            value={postcode}
            onChange={e => setPostcode(e.target.value.toUpperCase().trim())}
          />
          <button
            className='bg-hub-primary-600 text-white text-lg font-bold rounded-md w-full p-4 mt-4'
            // TODO: add postcode validation
            disabled={!postcode || isLoading}
          >
            {isLoading ? 'Loading...' : 'Search'}
          </button>
        </form>
        <div className="flex flex-col gap-2 border-t border-hub-background pt-4 text-hub-primary-neutral ">
          <HustingsCTA />
        </div>
      </div>
    )
  } else {
    // Unbranded
    return (
      <div className="flex flex-col gap-4 p-6">
        <h1 className='text-4xl tracking-tight mb-4 text-hub-primary-500'>
          Upcoming events
        </h1>
        <p className='text-lg leading-tight text-hub-primary-neutral'>
          Explore our map of upcoming events happening all over the UK or search your postcode to see what{"’"}s happening near you.
        </p>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="postcode"
            autoComplete="postal-code"
            className='p-4 text-lg w-full rounded-md border focus:ring-hub-secondary-500 active:border-hub-secondary-500 text-black'
            value={postcode}
            onChange={e => setPostcode(e.target.value.toUpperCase().trim())}
          />
          <button
            className='bg-hub-secondary-500 text-white text-lg font-bold rounded-md w-full p-4 mt-4'
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
      <p>
        Running your own hustings event? Add it to our map
      </p>
      <Link href="https://docs.google.com/forms/d/e/1FAIpQLSeQ6L2fko9q1xNvEYt0ZNbIIPDNAq6cs93Pn2Vx8ARtMf6FIg/viewform" target="_blank" className="">
        <Button className="bg-white border border-hub-primary-600 text-hub-primary-600 gap-2 hover:bg-hub-primary-50">
          <Plus />
          Add Event
        </Button>
      </Link>
    </>
  )
}