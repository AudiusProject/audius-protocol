import { ReactNode } from 'react'

import styles from '../OAuthLoginPage.module.css'

export const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <div className={styles.wrapper}>
    <div className={styles.container}>{children}</div>
  </div>
)
