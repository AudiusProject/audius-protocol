import type { PressableProps, ViewProps } from 'react-native'

import type { Icon } from 'app/harmony-native/icons'

export type SelectablePillProps = {
  type: 'button' | 'checkbox' | 'radio'
  size?: 'small' | 'large'
  isSelected?: boolean
  label: string
  value?: string
  icon?: Icon
  onChange?: (value: string) => void
  fullWidth?: boolean
} & Pick<PressableProps, 'disabled' | 'onPress'> &
  ViewProps
