import { ComponentConfig } from '@measured/puck'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React from 'react'

import illyHero from '@public/hub/illystrations/hero.svg'
import heroImg from '@public/hub/tcc-hero-image-7-jun.jpg'

import { PuckText } from '../../components/PuckText'

const words = ['Climate', 'People', 'Nature']

const RotatingWords = () => {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length)
    }, 4000) // Change word every 2 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <span>
      <AnimatePresence exitBeforeEnter>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {words[index]}
        </motion.div>
      </AnimatePresence>
    </span>
  )
}

export type HeroProps = {
  title: string
  description: string
  prompt: string
}

export const Hero: ComponentConfig<HeroProps> = {
  fields: {
    title: {
      type: 'text',
    },
    description: {
      type: 'textarea',
    },
    prompt: {
      type: 'text',
    },
  },
  defaultProps: {
    title: 'Heading',
    description: 'Description',
    prompt: 'Something',
  },
  render: (props) => {
    return <HeroRenderer {...props} />
  },
}

function HeroRenderer({ prompt, description }: HeroProps) {
  const router = useRouter()
  return (
    <div className=" rounded-[40px] flex flex-col lg:flex-row justify-end overflow-clip lg:gap-[25px] relative mb-[25px]">
      <Image
        className="lg:rounded-[40px] lg:absolute h-full w-full object-cover"
        src={heroImg}
        width={1200}
        height={1000}
        alt="hero image"
      />
      <div className="lg:absolute w-full "></div>
      <div className="z-20 lg:w-1/2 lg:mt-0 lg:py-[20px] lg:pr-[20px] gap-0 lg:max-w-[550px]">
        <div className="bg-hub-primary-50 lg:rounded-[20px] p-[25px] relative overflow-clip">
          <Image
            src={illyHero}
            alt="hub grid illustration"
            style={{
              zIndex: 1,
              right: -50,
              bottom: -50,
              position: 'absolute',
            }}
          />
          <div className="flex flex-col place-content-center gap-10 justify-between z-10 w-full relative">
            <div className="flex flex-col gap-2">
              <h1 className="text-hub5xl flex flex-wrap gap-3 pb-6">
                <span className="italic">The</span>{' '}
                <span className="text-hub-primary-400 w-[150px] flex justify-center">
                  <RotatingWords />
                </span>{' '}
                <span>Hub</span>
              </h1>
              <div className="text-hub-primary-neutral text-2xl">
                <PuckText text={description} />
              </div>
              <div className="text-hub-primary-neutral text-xl">
                <PuckText text={prompt} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
