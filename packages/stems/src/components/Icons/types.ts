import { ComponentType, SVGProps } from 'react'

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>> & {
  title?: string
}
