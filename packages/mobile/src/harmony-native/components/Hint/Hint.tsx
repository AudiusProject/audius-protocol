import type { IconComponent } from 'app/harmony-native/icons'

import type { PaperProps } from '../layout'
import { Paper } from '../layout'

export type HintProps = {
  icon: IconComponent
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
      alignItems='flex-start'
      backgroundColor='surface2'
      shadow='flat'
      border='strong'
      // Width 100% is necessary to allow for text wrapping inside
      // the flex container that wraps children
      style={{ width: '100%' }}
      {...other}
    >
      <Icon size='l' color='default' />
      {children}
    </Paper>
  )
}
