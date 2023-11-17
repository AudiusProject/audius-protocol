import { HTMLAttributes, PropsWithChildren } from 'react'

import { Flex, FlexProps } from '@audius/harmony'
import cn from 'classnames'

import styles from './MobileContentContainer.module.css'

export type MobileContentContainerProps = PropsWithChildren<FlexProps> &
  HTMLAttributes<HTMLDivElement>

export const MobileContentContainer = ({
  children,
  className
}: MobileContentContainerProps) => {
  return (
    <Flex
      className={cn(className, styles.root)}
      ph='l'
      pv='2xl'
      direction='column'
      gap='2xl'
      alignItems='center'
      w='100%'
    >
      {children}
    </Flex>
  )
}
