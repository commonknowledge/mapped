'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Switch } from '@/components/ui/switch'

interface CurrentNextGenTechProps {}

const CurrentNextGenTech: React.FC<CurrentNextGenTechProps> = () => {
  let inactive = '/illustration-inactive.svg'
  let active = '/illustration-active.svg'

  let textInactive = 'current'
  let textActive = 'next'

  const [toggle, setToggle] = useState(inactive)
  const [text, setText] = useState(textInactive)

  const changeSwitch = () => {
    let value = toggle

    if (value === inactive) {
      setToggle(active)
      setText(textActive)
    } else {
      setToggle(inactive)
      setText(textInactive)
    }
  }

  return (
    <>
      <Switch onCheckedChange={changeSwitch} onScroll={changeSwitch} />
      <h2 className="md:text-hXlg text-hLg font-light font-IBMPlexSansLight max-w-2xl text-center mb-10">
        The{' '}
        <span className="md:text-hXlgPP text-hLg font-PPRightGrotesk">
          {text}
        </span>{' '}
        generation of organiser tools
      </h2>
      <div className="grid md:grid-cols-2 grid-cols-1 gap-10 pb-20 items-center align-middle">
        <Image
          src={toggle}
          alt="test"
          width="0"
          height="0"
          sizes="100vw"
          className="w-full h-auto md:max-w-2xl px-10"
        />
        <div className="p-6 max-w-prose items-center">
          <p className="text-lg mb-4">
            The tools currently available for organisers do not match the
            ambitions organisers have. Poor user experience design and feature
            development has led to a restriction on what is possible for
            organisers.
          </p>
          <p className="text-lg font-IBMPlexSansSemiBold">
            Mapped is a tool designed to finally match the ambition of the
            movement.
          </p>
        </div>
      </div>
    </>
  )
}

export default CurrentNextGenTech
