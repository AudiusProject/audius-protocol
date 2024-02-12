import { ReactNode } from 'react'

import { IconAudiusLogoHorizontalColor } from '@audius/harmony'

import styles from '../OAuthLoginPage.module.css'

export const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className={styles.wrapper}>
    <div className={styles.container}>
      <div className={styles.centeredContent}>
        <div className={styles.logoContainer}>
          <IconAudiusLogoHorizontalColor width='194' height='auto' />
        </div>
      </div>
      {children}
    </div>
  </div>
)
