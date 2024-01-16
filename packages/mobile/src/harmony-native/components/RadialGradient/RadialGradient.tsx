import { useState } from 'react'

import { View } from 'react-native'
import type { RadialGradientProps } from 'react-native-radial-gradient'
import RNRadialGradient from 'react-native-radial-gradient'

// RadialGradient that uses percentages instead of pixels for center and radius
// This makes RadialGradient much more useful and dynamic
export const RadialGradient = (props: RadialGradientProps) => {
  const { center: centerProp, radius: radiusProp, style, ...other } = props
  const [{ height, width }, setDimensions] = useState({
    height: 0,
    width: 0
  })

  // Note using x,y coordinates because it allows dynamic updates
  // This technically works even though the types don't allow it
  const center = centerProp
    ? ({
        x: (centerProp[0] * width) / 100,
        y: (centerProp[1] * height) / 100
      } as unknown as RadialGradientProps['center'])
    : undefined

  // Since we cant have ellipse gradients, we use the average of height and width
  const radius = radiusProp
    ? (radiusProp * ((height + width) / 2)) / 100
    : undefined

  return (
    <View style={style} onLayout={(e) => setDimensions(e.nativeEvent.layout)}>
      <RNRadialGradient
        {...other}
        style={{ height, width }}
        center={center}
        radius={radius}
      />
    </View>
  )
}
