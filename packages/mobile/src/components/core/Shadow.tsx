import type { ReactNode } from 'react'
import { useMemo } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { makeStyles, shadow } from 'app/styles'

const useStyles = makeStyles(() => ({
  root: shadow()
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
  const styles = useStyles()

  const styleConfig = useMemo(
    () => [
      styles.root,
      style,
      offset ? { shadowOffset: offset } : null,
      color ? { shadowColor: color } : null,
      radius ? { shadowRadius: radius } : null,
      opacity ? { shadowOpacity: opacity } : null
    ],
    [styles.root, style, offset, color, radius, opacity]
  )

  return <View style={styleConfig}>{children}</View>
}
