import React from 'react'

import { StyleSheet, Animated } from 'react-native'

import AudiusLogoHorizontal from 'app/assets/images/audiusLogoHorizontal.svg'
import { useThemeColors } from 'app/utils/theme'

const styles = StyleSheet.create({
  root: {
    height: 24
  }
})

type LogoProps = {
  /**
   * Opacity animation to fade in logo as
   * the now playing drawer is dragged open.
   */
  opacityAnim: Animated.Value
}

export const Logo = ({ opacityAnim }: LogoProps) => {
  const { neutralLight4 } = useThemeColors()
  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: opacityAnim.interpolate({
            // Interpolate the animation such that the logo fades in
            // at 25% up the screen.
            inputRange: [0, 0.75, 1],
            outputRange: [1, 0, 0]
          })
        }
      ]}
    >
      <AudiusLogoHorizontal fill={neutralLight4} height='100%' width='100%' />
    </Animated.View>
  )
}
