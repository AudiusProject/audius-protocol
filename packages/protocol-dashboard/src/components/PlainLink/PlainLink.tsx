import { PropsWithChildren } from 'react'

import cn from 'classnames'

import styles from './PlainLink.module.css'

type PlainLinkProps = PropsWithChildren<{
  href?: string
  onClick?: () => void
  disabled?: boolean
}>

export const PlainLink = ({
  onClick,
  href,
  children,
  disabled
}: PlainLinkProps) => {
  return href ? (
    <a
      href={disabled ? undefined : href}
      target='_blank'
      rel='noreferrer'
      className={cn(styles.link, { [styles.disabled]: disabled })}
    >
      {children}
    </a>
  ) : (
    <button
      onClick={disabled ? undefined : onClick}
      className={cn(styles.link, { [styles.disabled]: disabled })}
    >
      {children}
    </button>
  )
}
