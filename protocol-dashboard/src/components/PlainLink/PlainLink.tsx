import styles from './PlainLink.module.css'
import { PropsWithChildren } from 'react'

type PlainLinkProps = PropsWithChildren<{
  href?: string
  onClick?: () => void
}>

export const PlainLink = ({ onClick, href, children }: PlainLinkProps) => {
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={styles.link}>
      {children}
    </a>
  ) : (
    <button onClick={onClick} className={styles.link}>
      {children}
    </button>
  )
}
