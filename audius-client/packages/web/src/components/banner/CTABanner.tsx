import { ReactComponent as IconArrow } from 'assets/img/iconArrowGrey.svg'
import Banner from 'components/banner/Banner'
import Pill from 'components/pill/Pill'

import styles from './CTABanner.module.css'

const messages = {
  cta: 'Download the Audius App'
}

type CTABannerProps = {
  onAccept: () => void
  onClose: () => void
}

const CTABanner = (props: CTABannerProps) => {
  return (
    <Banner {...props}>
      <div className={styles.ctaBanner} onClick={props.onAccept}>
        <div className={styles.content}>
          <Pill
            className={styles.pill}
            textClassName={styles.pillText}
            showIcon={false}
            clickable={false}
          />
          <div className={styles.contentSelection}>
            <span className={styles.celebration}>
              <i className='emoji face-with-party-horn-and-party-hat' />
            </span>
            <div className={styles.text}>{messages.cta}</div>
            <IconArrow className={styles.arrow} />
          </div>
        </div>
      </div>
    </Banner>
  )
}

export default CTABanner
