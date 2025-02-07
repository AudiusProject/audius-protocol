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
    <div className={wm(styles.qrContainer)}>
      <img className={styles.qr} src={QRCode} alt='QR Code' />
      <div className={styles.qrTextContainer}>
        <h2 className={styles.qrText}>{messages.qrText}</h2>
        <h3 className={styles.qrSubtext}>{messages.qrSubtext}</h3>
      </div>
    </div>
  )
}
