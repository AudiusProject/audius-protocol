import cn from 'classnames'

import { Banner } from 'components/banner/Banner'

import styles from './FanburstBanner.module.css'

const messages = {
  home: `Audius is the new home of Fanburst!`,
  stream: `Upload and Stream HQ Audio at 320kbps for FREE!`,
  mobileHome: `Audius is the new home of Fanburst!`,
  mobileStream: `HQ Audio at 320kbps for FREE!`
}

type FanburstBannerProps = {
  onClose: () => void
  isMobile: boolean
}
/**
 * Displays a welcome banner on the landing page when users are coming to Audius from a Fanburst redirect
 */
export const FanburstBanner = ({ onClose, isMobile }: FanburstBannerProps) => {
  return (
    <Banner
      isMobile={isMobile}
      onClose={onClose}
      className={cn(styles.banner, { [styles.isMobile]: isMobile })}
    >
      <div className={styles.text}>
        <span>
          {isMobile ? messages.mobileHome : messages.home}
          <span className={styles.starEyes}>
            <i className='emoji grinning-face-with-star-eyes' />
          </span>
        </span>
        <span>{isMobile ? messages.mobileStream : messages.stream}</span>
      </div>
    </Banner>
  )
}
