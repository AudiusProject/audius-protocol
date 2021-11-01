import React, { useState } from 'react'
import { Image, View } from 'react-native'

const AutoSizeImage = (props: ConstructorParameters<typeof Image>[0]) => {
  const [size, setSize] = useState(0)

  return (
    <View
      onLayout={e => {
        setSize(e.nativeEvent.layout.width)
      }}
    >
      <Image {...props} style={[props.style, { width: size, height: size }]} />
    </View>
  )
}

export default AutoSizeImage
