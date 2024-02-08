import { ReactNode } from 'react'

import { IconArrowRight } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import cn from 'classnames'

import QRCode from 'assets/img/imageQR.png'

import styles from './AppCTA.module.css'

const messages = {
  appCTA: 'Get The App',
  description: `
    Take Audius with you! Download the Audius
    mobile app and listen to remixes, tracks, and
    playlists in incredible quality from anywhere.
  `,
  qrInstruction: `
    Scan This Code with Your
    Phone Camera
  `,
  continue: 'Continue'
}

type AppCTAProps = {
  onNextPage: () => void
}

const Title = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => <h2 className={cn(styles.title, className)}>{children}</h2>

const Subtitle = ({
  children,
  className
}: {
  children: ReactNode
  className?: string
}) => <div className={cn(styles.subtitle, className)}>{children}</div>

const AppCTA = ({ onNextPage }: AppCTAProps) => {
  return (
    <div className={styles.container}>
      <Title className={styles.topText}>{messages.appCTA}</Title>
      <Subtitle className={styles.descriptionText}>
        {messages.description}
      </Subtitle>
      <img src={QRCode} className={styles.qrCode} alt='QR Code' />
      <Subtitle className={styles.bottomText}>
        {messages.qrInstruction}
      </Subtitle>
      <Button
        text='Continue'
        name='continue'
        rightIcon={<IconArrowRight />}
        type={ButtonType.PRIMARY_ALT}
        onClick={onNextPage}
        textClassName={styles.continueButtonText}
        className={styles.continueButton}
      />
    </div>
  )
}

export default AppCTA
