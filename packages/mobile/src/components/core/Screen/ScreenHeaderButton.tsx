import { SelectablePill } from '@audius/harmony-native'
import type { SelectablePillProps } from 'app/harmony-native/components/input/SelectablePill/types'

type ScreenHeaderButtonProps = Omit<SelectablePillProps, 'type'>

export const ScreenHeaderButton = (props: ScreenHeaderButtonProps) => {
  return <SelectablePill type='button' {...props} />
}
