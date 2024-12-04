import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ReactNode } from 'react'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// Define the props interface with both props
interface TemplateCardProps {
  heading: ReactNode
  description: string
  link: string
  tag?: string
  labels?: ReactNode
  highlighted: boolean // Add highlighted prop
  isExternalLink?: boolean
  icon?: ReactNode
  className?: string
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  heading,
  description,
  link,
  isExternalLink,
  tag,
  highlighted,
  labels,
  icon,
  className,
}) => {
  return (
    <>
      <Link href={link}>
        <Card
          className={`${highlighted ? 'bg-meepGray-700 border-meepGray-600 hover:bg-meepGray-600 transition' : 'hover:bg-meepGray-700 transition'} p-6 h-full ${className}`}
        >
          <CardHeader>
            <CardTitle className="mb-3 flex gap-2 items-center">
              {icon ? <div className="text-meepGray-400 w-6 h-6">{icon}</div> : null}
              <p className="flex-grow">{heading}</p>
              {isExternalLink ? <ExternalLink className="w-4 h-4" /> : null}
            </CardTitle>
            <CardDescription className="text-md text-meepGray-400 line-clamp-4">
              {description}
            </CardDescription>
            <div className="pt-4">{labels}</div>
          </CardHeader>
          {tag && (
            <CardFooter className="pt-6">
              <div
                className={`rounded-full ${highlighted ? 'bg-meepGray-600' : 'bg-meepGray-700'} py-1 px-2 text-tiny`}
              >
                {tag}
              </div>
            </CardFooter>
          )}
        </Card>
      </Link>
    </>
  )
}

export default TemplateCard
