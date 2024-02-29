import { ReactNode } from 'react'

import type { IconComponent } from 'components/icon'
import { Flex } from 'components/layout'
import { Paper, PaperProps } from 'components/layout/Paper'
import { Text } from 'components/text'

type HintProps = {
  icon: IconComponent
  actions?: ReactNode
} & PaperProps

/*
 * A way of informing the user of important details in line in a prominent way.
 */
export const Hint = (props: HintProps) => {
  const { icon: Icon, children, actions, ...other } = props
  return (
    <Paper
      role='alert'
      backgroundColor='surface2'
      ph='l'
      pv='m'
      direction='column'
      gap='m'
      shadow='flat'
      border='strong'
      {...other}
    >
      <Flex gap='l' alignItems='center'>
        <Icon size='l' color='default' />
        <Text variant='body' color='default'>
          {children}
        </Text>
      </Flex>
      <Flex pl='unit10' gap='l'>
        {actions}
      </Flex>
    </Paper>
  )
}
