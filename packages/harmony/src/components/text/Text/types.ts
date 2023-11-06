import type {
  ComponentProps,
  ElementType,
  ForwardedRef,
  ReactNode
} from 'react'

import type { TextColors } from 'foundations'

export type TextOwnProps<TextComponentType extends ElementType = 'p'> = {
  tag?: TextComponentType
  className?: string
  children?: ReactNode
  variant?: TextVariant
  size?: TextSize
  strength?: TextStrength
  color?: TextColors
  innerRef?: ForwardedRef<HTMLElement>
  asChild?: boolean
}

export type TextProps<TextComponentType extends ElementType = 'p'> =
  TextOwnProps<TextComponentType> &
    Omit<ComponentProps<TextComponentType>, keyof TextOwnProps | 'ref'>

export type TextStrength = 'weak' | 'default' | 'strong'

export type TextSize = 'xl' | 'l' | 'm' | 's' | 'xs'

export type TextVariant = 'display' | 'heading' | 'title' | 'label' | 'body'
export type VariantSizeTagMap = Partial<Record<TextSize, ElementType>>
