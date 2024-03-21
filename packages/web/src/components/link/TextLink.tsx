import { Ref, forwardRef, useCallback, MouseEvent } from 'react'

import {
  TextLink as HarmonyTextLink,
  TextLinkProps as HarmonyTextLinkProps
} from '@audius/harmony'
import { Link, LinkProps } from 'react-router-dom'

export type TextLinkProps = HarmonyTextLinkProps &
  LinkProps & {
    stopPropagation?: boolean
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
      <Link to={to}>{children}</Link>
    </HarmonyTextLink>
  )
})
