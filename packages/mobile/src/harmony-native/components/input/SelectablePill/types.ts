import type { PressableProps, ViewProps } from 'react-native'

import type { Icon } from 'app/harmony-native/icons'

export type SelectablePillProps = {
  size?: 'small' | 'large'
  isSelected?: boolean
  label: string
  icon?: Icon
} & Pick<PressableProps, 'disabled' | 'onPress'> &
  ViewProps
