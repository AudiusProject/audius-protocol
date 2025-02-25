import { Flex, Text } from '@audius/harmony'

import QRCode from 'assets/img/imageQR.png'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './styles.module.css'

const messages = {
  qrText: 'Download the App',
  qrSubtext: 'Scan This QR Code with Your Phone Camera'
}

export const MobileInstallContent = () => {
  const wm = useWithMobileStyle(styles.mobile)

  return (
    <Flex column alignItems='center' className={wm(styles.qrContainer)}>
      <img className={styles.qr} src={QRCode} alt='QR Code' />
      <Flex column alignItems='center' className={styles.qrTextContainer}>
        <Text variant='title' size='l'>
          {messages.qrText}
        </Text>
        <Text variant='title' size='s' color='subdued'>
          {messages.qrSubtext}
        </Text>
      </Flex>
    </Flex>
  )
}
