import Image from 'next/image'
import { ReactNode } from 'react'

import TemplateTextBlock from './TemplateTextBlock'

interface TemplateTextAndImage {
  labelHeading?: string
  heading: ReactNode
  description: string
  btnText?: string
  btnLink?: string
  center?: boolean
  imgSrc?: string
  imgAlt?: string
}

const TemplateTextAndImage: React.FC<TemplateTextAndImage> = ({
  labelHeading,
  heading,
  description,
  btnLink,
  btnText,
  imgSrc,
}) => {
  return (
    <div className="grid md:grid-cols-2 grid-cols-1 place-content-center py-20">
      {imgSrc && (
        <div className="flex flex-col gap-4 place-content-center items-center">
          <Image
            src={imgSrc}
            alt="test"
            width="0"
            height="0"
            sizes="100vw"
            className="w-full h-auto"
          />
        </div>
      )}
      <div className="flex items-center">
        <TemplateTextBlock
          labelHeading={labelHeading}
          heading={heading}
          description={description}
          btnText={btnText}
          btnLink={btnLink}
        />
      </div>
    </div>
  )
}

export default TemplateTextAndImage
