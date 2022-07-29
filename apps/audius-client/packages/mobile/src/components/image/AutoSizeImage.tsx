import { useState } from 'react'

import type { ImageProps } from 'react-native'
import { Image, View } from 'react-native'

const AutoSizeImage = (props: ImageProps) => {
  const [size, setSize] = useState(0)

  return (
    <View
      onLayout={(e) => {
        setSize(e.nativeEvent.layout.width)
      }}
    >
      <Image {...props} style={[props.style, { width: size, height: size }]} />
    </View>
  )
}

export default AutoSizeImage
