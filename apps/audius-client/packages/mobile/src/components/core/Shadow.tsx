import type { ReactNode } from 'react'
import { useMemo } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { makeStyles, shadow } from 'app/styles'

type ShadowConfig = Pick<
  ViewStyle,
  'shadowOffset' | 'shadowColor' | 'shadowOpacity' | 'shadowRadius'
>

const useStyles = makeStyles<ShadowConfig>((_, shadowConfig) => ({
  root: {
    ...shadow(),
    ...shadowConfig
  }
}))

type ShadowProps = {
  offset?: { width: number; height: number }
  color?: string
  radius?: number
  opacity?: number
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export const Shadow = (props: ShadowProps) => {
  const { offset, color, radius, opacity, children, style } = props
  const styleConfig = useMemo(
    () => ({
      ...(offset ? { shadowOffset: offset } : {}),
      ...(color ? { shadowColor: color } : {}),
      ...(radius ? { shadowRadius: radius } : {}),
      ...(opacity ? { shadowOpacity: opacity } : {})
    }),
    [offset, color, radius, opacity]
  )

  const styles = useStyles(styleConfig)

  return <View style={[styles.root, style]}>{children}</View>
}
