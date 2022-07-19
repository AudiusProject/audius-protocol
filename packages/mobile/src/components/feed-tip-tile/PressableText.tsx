import { useCallback, useState } from 'react'

import { StyleProp, ViewStyle } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler'

type PressableTextProps = {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  children: (config: { pressed: boolean }) => JSX.Element
}

export const PressableText = (props: PressableTextProps) => {
  const { children, ...other } = props
  const [pressed, setPressed] = useState(false)
  const handlePressIn = useCallback(() => setPressed(true), [])
  const handlePressOut = useCallback(() => setPressed(false), [])

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...other}>
      {children({ pressed })}
    </TouchableWithoutFeedback>
  )
}
