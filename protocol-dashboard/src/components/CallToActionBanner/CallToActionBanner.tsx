import cn from 'classnames'
import { PropsWithChildren, ReactNode } from 'react'

import styles from './CallToActionBanner.module.css'

const messages = {
  audiusMusic: 'Audius Music'
}

export type CallToActionBannerProps = PropsWithChildren<{
  href: string
  text: ReactNode
  pillText: ReactNode
  size?: 'small' | 'large'
}>

type PillProps = PropsWithChildren<{}>
const Pill = ({ children }: PillProps) => {
  return <div className={styles.pill}>{children}</div>
}

type BannerProps = PropsWithChildren<{}>
const Banner = ({ children }: BannerProps) => {
  return (
    <div
      className={cn(styles.banner, {
        [styles.isMobile]: false
      })}
    >
      {children}
    </div>
  )
}

export const CallToActionBanner = ({
  text,
  pillText,
  href
}: CallToActionBannerProps) => {
  return (
    <Banner>
      <a
        className={cn(styles.ctaBanner, {
          [styles.isMobile]: false
        })}
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        <div className={styles.content}>
          <Pill>{pillText}</Pill>
          <div className={styles.contentSelection}>
            <div
              className={cn(styles.text, {
                // [styles.small]: size === 'small'
              })}
            >
              {text}
            </div>
          </div>
        </div>
      </a>
    </Banner>
  )
}
