import { ComponentConfig } from '@measured/puck'
import Image from 'next/image'

import heroImg from '@public/hub/hero-img.jpg'

export type AboutProps = {}

export const About: ComponentConfig<AboutProps> = {
  label: 'About',
  fields: {},
  render: (args) => <Render />,
}

function Render(props: AboutProps) {
  return (
    <section className="!leading-tight my-24" id="about">
      <header className="text-hub-primary-neutral uppercase text-sm pt-24 pb-16 text-center">
        <h2>About us</h2>
      </header>
      <div className="grid sm:grid-cols-2 gap-8">
        <p className="!leading-tight text-hub4xl text-hub-primary-800">
          83% of people in the UK think the government should do more to tackle
          climate change.
        </p>
        <p className="text-hub-primary-neutral !leading-tight text-hubxl">
          Public support for climate and nature action is both massive and
          mainstream. Yet political commitments as they currently stand mean
          we're failing to meet both domestic goals, and our obligations to
          support those across the world to tackle the impacts of the climate
          crisis.
        </p>
        <Image
          src={heroImg}
          alt="Hero image"
          className="hidden sm:block rounded-2xl overflow-clip h-full"
          style={{ objectFit: 'cover' }}
        />
        <div className="text-hub-primary-neutral !leading-tight text-hubxl space-y-5">
          <p className="text-hub-primary-800 !leading-tight text-hub2xl">
            People across the UK are already taking action to tackle climate
            change and protect nature.
          </p>
          <p>
            It’s time for politicians from all political parties to follow suit
            and commit to ambitious action ahead of the UK general election and
            in the first crucial months of the new parliament, in this critical
            decade for our planet.
          </p>
          <p>
            We’re calling on all political parties to commit to cut emissions,
            restore nature and support the hardest hit at home and around the
            world.
          </p>
          <p className="text-hub-primary-600">
            We are united for people, climate and nature.
          </p>
        </div>
      </div>
    </section>
  )
}
