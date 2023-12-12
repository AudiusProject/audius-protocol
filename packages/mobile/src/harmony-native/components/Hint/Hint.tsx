import type { Icon } from 'app/harmony-native/icons'

import { Text } from '../Text/Text'
import type { PaperProps } from '../layout'
import { Box, Paper } from '../layout'

export type HintProps = {
  icon: Icon
} & PaperProps

export const Hint = (props: HintProps) => {
  const { icon: Icon, children, ...other } = props
  return (
    <Paper
      role='alert'
      direction='row'
      gap='l'
      ph='l'
      pv='m'
      alignItems='center'
      backgroundColor='surface2'
      shadow='flat'
      border='strong'
      {...other}
    >
      <Icon size='l' color='default' />
      <Box flex={1}>
        <Text variant='body' color='default'>
          {children}
        </Text>
      </Box>
    </Paper>
  )
}
