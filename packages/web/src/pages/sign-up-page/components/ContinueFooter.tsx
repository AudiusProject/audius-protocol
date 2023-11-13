import { PropsWithChildren } from 'react'

import { Flex } from '@audius/harmony'

import styles from './ContinueFooter.module.css'

type ContinueFooterProps = PropsWithChildren<{}>

export const ContinueFooter = ({ children }: ContinueFooterProps) => {
  return (
    <Flex
      pv='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      className={styles.container}
    >
      {children}
    </Flex>
  )
}
