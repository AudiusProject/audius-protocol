import { useCallback, MouseEvent, ElementType } from 'react'

import { Text, TextProps } from '@audius/harmony'
import cn from 'classnames'
import { Link as LinkBase, LinkProps as LinkBaseProps } from 'react-router-dom'

import styles from './Link.module.css'

export type LinkProps<Element extends ElementType = LinkBase> =
  LinkBaseProps<Element> &
    TextProps<Element> & {
      stopPropagation?: boolean
    }

export const Link = <Element extends ElementType = 'a'>(
  props: LinkProps<Element>
) => {
  const { className, onClick, stopPropagation = true, as, ...other } = props

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(e)
      if (stopPropagation) {
        e.stopPropagation()
      }
    },
    [onClick, stopPropagation]
  )

  return (
    // @ts-expect-error
    <Text
      as={as ?? LinkBase}
      className={cn(styles.root, className)}
      onClick={handleClick}
      {...other}
    />
  )
}
