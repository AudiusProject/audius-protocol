import { ReactNode } from 'react'

import HorizontalLogo from 'assets/img/Horizontal-Logo-Full-Color.png'

import styles from '../OAuthLoginPage.module.css'

export const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className={styles.wrapper}>
    <div className={styles.container}>
      <div className={styles.centeredContent}>
        <div className={styles.logoContainer}>
          <img src={HorizontalLogo} className={styles.logo} alt='Audius Logo' />
        </div>
      </div>
      {children}
    </div>
  </div>
)
