import { PropsWithChildren } from 'react'

import { Flex, FlexProps } from '@audius/harmony'

import styles from './LeftContentContainer.module.css'

type LeftContentContainerProps = PropsWithChildren<FlexProps>

export const LeftContentContainer = (props: LeftContentContainerProps) => {
  const { children, ...restProps } = props

  return (
    <Flex
      className={styles.root}
      h='100%'
      w={480}
      pv='4xl'
      ph='2xl'
      direction='column'
      {...restProps}
    >
      {children}
    </Flex>
  )
}
