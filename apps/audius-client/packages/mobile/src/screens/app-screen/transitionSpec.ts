import { TransitionPresets } from '@react-navigation/stack'
import { TransitionSpec } from '@react-navigation/stack/lib/typescript/src/types'

export const onlyAnimateOut = {
  open: { animation: 'timing', config: { duration: 0 } } as TransitionSpec,
  close: TransitionPresets.DefaultTransition.transitionSpec.close
}
