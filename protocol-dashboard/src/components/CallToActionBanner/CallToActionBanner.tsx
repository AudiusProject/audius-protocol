import { PropsWithChildren, ReactNode } from 'react'

import cn from 'classnames'

import styles from './CallToActionBanner.module.css'

export type CallToActionBannerProps = PropsWithChildren<{
  href: string
  text: ReactNode
  pillText: ReactNode
}>

type PillProps = PropsWithChildren<{}>
const Pill = ({ children }: PillProps) => {
  return <div className={styles.pill}>{children}</div>
}

type BannerProps = PropsWithChildren<{}>
const Banner = ({ children }: BannerProps) => {
  return <div className={cn(styles.banner)}>{children}</div>
}

export const CallToActionBanner = ({
  text,
  pillText,
  href
}: CallToActionBannerProps) => {
  return (
    <Banner>
      <a
        className={cn(styles.ctaBanner)}
        href={href}
        rel='noreferrer'
        target='_blank'
      >
        <div className={styles.content}>
          <Pill>{pillText}</Pill>
          <div className={styles.contentSelection}>
            <div className={styles.text}>{text}</div>
          </div>
        </div>
      </a>
    </Banner>
  )
}
