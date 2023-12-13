import styles from './StartListeningBanner.module.css'
import { IconNote } from '@audius/stems'

import { CallToActionBanner } from 'components/CallToActionBanner/CallToActionBanner'
import { AUDIUS_DAPP_URL } from 'utils/routes'

export const StartListeningBanner = () => {
  return (
    <div className={styles.root}>
      <CallToActionBanner
        href={AUDIUS_DAPP_URL}
        pillText="Audius Music"
        text={
          <div className={styles.textContainer}>
            Start Listening Now!
            <IconNote />
          </div>
        }
      />
    </div>
  )
}
