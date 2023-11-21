import { PropsWithChildren } from 'react'

import { Flex, useTheme } from '@audius/harmony'

import styles from './ContinueFooter.module.css'

type ContinueFooterProps = PropsWithChildren<{}>

export const ContinueFooter = ({ children }: ContinueFooterProps) => {
  const { color } = useTheme()
  return (
    <Flex
      w='100%'
      pv='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      shadow='midInverted'
      className={styles.container}
      css={{ backgroundColor: color.background.white, zIndex: 2 }}
    >
      {children}
    </Flex>
  )
}
