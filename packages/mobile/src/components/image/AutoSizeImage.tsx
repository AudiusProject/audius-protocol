import { useState } from 'react'

import { Image, View, ImageProps } from 'react-native'

const AutoSizeImage = (props: ImageProps) => {
  const [size, setSize] = useState(0)

  return (
    <View
      onLayout={(e) => {
        setSize(e.nativeEvent.layout.width)
      }}>
      <Image {...props} style={[props.style, { width: size, height: size }]} />
    </View>
  )
}

export default AutoSizeImage
