import type { ReactChild } from 'react'

import type { TextStyle, ViewStyle } from 'react-native'
import { View } from 'react-native'

import { GradientText } from 'app/components/core'
import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

type ScreenHeaderProps = {
  children?: ReactChild
  text: string
  styles?: StylesProp<{ root: ViewStyle; header: TextStyle }>
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: palette.white,
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8,
    paddingHorizontal: spacing(3),
    borderTopWidth: 1,
    borderTopColor: palette.neutralLight8
  },
  header: {
    fontSize: 24,
    lineHeight: 52,
    textShadowOffset: { height: 2, width: 0 },
    textShadowRadius: 4,
    textShadowColor: 'rgba(162,47,235,0.2)'
  }
}))

export const Header = (props: ScreenHeaderProps) => {
  const { children, text, styles: stylesProp } = props
  const styles = useStyles()

  return (
    <View style={[styles.root, stylesProp?.root]}>
      <GradientText
        accessibilityRole='header'
        style={[styles.header, stylesProp?.header]}
      >
        {text}
      </GradientText>
      {children}
    </View>
  )
}
