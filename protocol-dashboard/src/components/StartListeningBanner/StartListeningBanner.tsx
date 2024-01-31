import styles from './StartListeningBanner.module.css'
import { IconNote } from '@audius/stems'

import { CallToActionBanner } from 'components/CallToActionBanner/CallToActionBanner'
import { AUDIUS_DAPP_URL } from 'utils/routes'

const messages = {
  audiusMusic: 'Audius Music',
  startListening: 'Start Listening Now!'
}

export const StartListeningBanner = () => {
  return (
    <div className={styles.root}>
      <CallToActionBanner
        href={AUDIUS_DAPP_URL}
        pillText={messages.audiusMusic}
        text={
          <div className={styles.textContainer}>
            {messages.startListening}
            <IconNote />
          </div>
        }
      />
    </div>
  )
}
