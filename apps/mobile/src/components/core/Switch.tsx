import { useCallback } from 'react'

import type { SwitchProps as RNSwitchProps } from 'react-native'
import { Switch as RNSwitch } from 'react-native'
import { useToggle } from 'react-use'

import { light } from 'app/haptics'
import { useThemeColors } from 'app/utils/theme'

type SwitchProps = RNSwitchProps & {
  defaultValue?: boolean
}

export const Switch = (props: SwitchProps) => {
  const {
    defaultValue = false,
    value,
    onValueChange: onValueChangeProp,
    ...other
  } = props
  const { neutralLight6, neutralLight9, secondary } = useThemeColors()
  const [isEnabledState, setIsEnabled] = useToggle(defaultValue)

  const isEnabled = value ?? isEnabledState

  const handleValueChange = useCallback(
    (value: boolean) => {
      onValueChangeProp?.(value)
      setIsEnabled(value)
      light()
    },
    [onValueChangeProp, setIsEnabled]
  )

  return (
    <RNSwitch
      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
      trackColor={{ false: neutralLight6, true: secondary }}
      thumbColor={neutralLight9}
      value={isEnabled}
      onValueChange={handleValueChange}
      {...other}
    />
  )
}
