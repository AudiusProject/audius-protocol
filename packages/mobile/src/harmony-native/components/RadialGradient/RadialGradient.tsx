import { useState } from 'react'

import { css } from '@emotion/native'
import { Platform, View } from 'react-native'
import type { RadialGradientProps } from 'react-native-radial-gradient'
import RNRadialGradient from 'react-native-radial-gradient'

const fullSize = css({ height: '100%', width: '100%' })

// RadialGradient that uses percentages instead of pixels for center and radius
// This makes RadialGradient much more useful and dynamic
export const RadialGradient = (props: RadialGradientProps) => {
  const {
    center: centerProp = [50, 50],
    radius: radiusProp,
    style,
    ...other
  } = props
  const [{ height, width }, setDimensions] = useState({
    height: 0,
    width: 0
  })

  let center = centerProp
    ? [(centerProp[0] * width) / 100, (centerProp[1] * height) / 100]
    : undefined

  // We update the center prop to use x,y coordinates on iOS due to
  // bug where center prop cannot be updated on iOS
  if (Platform.OS === 'ios') {
    center = center
      ? ({
          x: center[0],
          y: center[1]
        } as unknown as RadialGradientProps['center'])
      : undefined
  }

  // Since we cant have ellipse gradients, we use the average of height and width
  const radius = radiusProp
    ? (radiusProp * ((height + width) / 2)) / 100
    : undefined

  return (
    <View
      style={[fullSize, style]}
      onLayout={(e) => setDimensions(e.nativeEvent.layout)}
    >
      <RNRadialGradient
        {...other}
        style={[style, { height, width }]}
        center={center}
        radius={radius}
      />
    </View>
  )
}
