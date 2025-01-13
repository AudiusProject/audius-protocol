import { ReactNode } from 'react'

import { Client } from '@audius/common/models'
import { IconArrowRight, Pill } from '@audius/harmony'
import cn from 'classnames'

import { Banner, BannerProps } from 'components/banner/Banner'
import { getClient } from 'utils/clientUtil'

import styles from './CallToActionBanner.module.css'

export type CallToActionBannerProps = Pick<
  BannerProps,
  'onClose' | 'className'
> & {
  onAccept: () => void
  emoji?: string
  pill?: string
  pillPosition?: 'left' | 'right'
  text: ReactNode
  size?: 'small' | 'large'
}

export const CallToActionBanner = (props: CallToActionBannerProps) => {
  const {
    emoji,
    pill,
    pillPosition = 'left',
    text,
    onAccept,
    size,
    ...bannerProps
  } = props

  const client = getClient()

  const pillElement = (
    <Pill
      variant='custom'
      css={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
    >
      {pill}
    </Pill>
  )

  return (
    <Banner
      isElectron={client === Client.ELECTRON}
      isMobile={client === Client.MOBILE}
      {...bannerProps}
    >
      <div
        className={cn(styles.ctaBanner, {
          [styles.isMobile]: client === Client.MOBILE
        })}
        onClick={onAccept}
      >
        <div className={styles.content}>
          {pill && pillPosition === 'left' ? pillElement : null}
          <div className={styles.contentSelection}>
            {emoji ? (
              <i
                className={cn('emoji', emoji)}
                css={{ minWidth: 24, minHeight: 24 }}
              />
            ) : null}
            <div
              className={cn(styles.text, {
                [styles.small]: size === 'small'
              })}
            >
              {text}
            </div>
            <IconArrowRight
              className={cn(styles.arrow, { [styles.small]: size === 'small' })}
            />
          </div>
          {pill && pillPosition === 'right' ? pillElement : null}
        </div>
      </div>
    </Banner>
  )
}
