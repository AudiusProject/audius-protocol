import type { IconComponent } from 'components/icon'
import { Paper, PaperProps } from 'components/layout/Paper'
import { Text } from 'components/text'

type HintProps = {
  icon: IconComponent
} & PaperProps

/*
 * A way of informing the user of important details in line in a prominent way.
 */
export const Hint = (props: HintProps) => {
  const { icon: Icon, children, ...other } = props
  return (
    <Paper
      role='alert'
      ph='l'
      pv='m'
      backgroundColor='surface2'
      alignItems='center'
      gap='l'
      shadow='flat'
      border='strong'
      {...other}
    >
      <Icon size='l' color='default' />
      <Text variant='body' color='default'>
        {children}
      </Text>
    </Paper>
  )
}
