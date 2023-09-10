import type { ReactNode } from 'react'

import type { StyleProp, TextStyle, ViewStyle } from 'react-native'
import { Pressable } from 'react-native'

import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

import { Text } from './Text'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    margin: spacing(1),
    borderRadius: 2,
    backgroundColor: palette.neutralLight4,
    paddingVertical: spacing(1),
    paddingHorizontal: spacing(2),
    color: palette.white,
    textTransform: 'uppercase',
    overflow: 'hidden'
  }
}))

type TagProps = {
  onPress?: () => void
  children: ReactNode
  style?: StyleProp<ViewStyle>
  styles?: StylesProp<{ root: ViewStyle; text: TextStyle }>
}

export const Tag = (props: TagProps) => {
  const { onPress, children, style, styles: stylesProp } = props
  const styles = useStyles()

  return (
    <Pressable onPress={onPress} style={[style, stylesProp?.root]}>
      <Text style={[styles.root, stylesProp?.text]} variant='label'>
        {children}
      </Text>
    </Pressable>
  )
}
