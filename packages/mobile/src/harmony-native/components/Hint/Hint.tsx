import type { ReactNode } from 'react'

import { IconQuestionCircle, type IconComponent } from '../../icons'
import { Text } from '../Text/Text'
import type { PaperProps } from '../layout'
import { Flex, Paper } from '../layout'

export type HintProps = {
  icon?: IconComponent
  actions?: ReactNode
} & PaperProps

export const Hint = (props: HintProps) => {
  const { icon: Icon = IconQuestionCircle, children, actions, ...other } = props
  return (
    <Paper
      role='alert'
      gap='l'
      ph='l'
      pv='m'
      alignItems='flex-start'
      backgroundColor='surface2'
      shadow='flat'
      border='strong'
      {...other}
    >
      <Flex gap='l' alignItems='center' direction='row'>
        <Icon size='l' color='default' />
        <Text variant='body' flexShrink={1}>
          {children}
        </Text>
      </Flex>
      {actions ? (
        <Flex pl='unit10' gap='l'>
          {actions}
        </Flex>
      ) : null}
    </Paper>
  )
}
