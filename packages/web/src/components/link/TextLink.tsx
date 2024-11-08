import { Ref, forwardRef, useCallback, MouseEvent } from 'react'

import { ID } from '@audius/common/models'
import {
  TextLink as HarmonyTextLink,
  TextLinkProps as HarmonyTextLinkProps
} from '@audius/harmony'
import { Link, LinkProps } from 'react-router-dom'

export type LinkKind = 'track' | 'collection' | 'user' | 'mention' | 'other'

export type TextLinkProps = HarmonyTextLinkProps &
  Partial<Omit<LinkProps, 'color' | 'onClick'>> & {
    stopPropagation?: boolean
    onClick?: (
      e: MouseEvent<HTMLAnchorElement>,
      linkKind?: LinkKind,
      linkEntityId?: ID
    ) => void
  }

export const TextLink = forwardRef((props: TextLinkProps, ref: Ref<'a'>) => {
  const { to, children, stopPropagation = true, onClick, ...other } = props

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (stopPropagation) {
        e.stopPropagation()
      }
      onClick?.(e)
    },
    [stopPropagation, onClick]
  )

  return (
    <HarmonyTextLink ref={ref} asChild onClick={handleClick} {...other}>
      {to ? <Link to={to}>{children}</Link> : <span>{children}</span>}
    </HarmonyTextLink>
  )
})
