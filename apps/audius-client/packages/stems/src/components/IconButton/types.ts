import { ComponentPropsWithoutRef, ReactNode } from 'react'

type BaseIconButtonProps = {
  disabled?: boolean
  isActive?: boolean
  activeClassName?: string
  icon: ReactNode
  /** Aria label must be provided for an icon button as icons have no text */
  'aria-label': string
}

export type IconButtonAnchorProps = BaseIconButtonProps & {
  href: string
} & ComponentPropsWithoutRef<'a'>

export type IconButtonButtonProps = BaseIconButtonProps &
  ComponentPropsWithoutRef<'button'>

export type IconButtonProps = IconButtonAnchorProps | IconButtonButtonProps
