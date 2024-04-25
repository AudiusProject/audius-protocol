import { ReactNode } from 'react'

import { Paper } from '@audius/harmony'
import cn from 'classnames'

import styles from '../OAuthLoginPage.module.css'
import { Display } from '../types'

export const ContentWrapper = ({
  display,
  children
}: {
  display: Display
  children: ReactNode
}) => (
  <div className={cn(styles.wrapper, { [styles.popup]: display === 'popup' })}>
    {display === 'popup' ? (
      <div className={styles.container}>{children}</div>
    ) : (
      <Paper
        shadow='mid'
        w='375px'
        direction='column'
        pv='3xl'
        ph='xl'
        mt='3xl'
        alignSelf='flex-start'
        borderRadius='xl'
      >
        {children}
      </Paper>
    )}
  </div>
)
