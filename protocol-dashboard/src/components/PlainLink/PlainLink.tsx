import styles from './PlainLink.module.css'
import { PropsWithChildren } from 'react'

type PlainLinkProps = PropsWithChildren<{
  href?: string
}>

export const PlainLink = ({ href, children }: PlainLinkProps) => {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={styles.link}>
      {children}
    </a>
  )
}
