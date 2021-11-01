import React, { useState } from 'react'
import { View } from 'react-native'

import Video from 'react-native-video'

const AutoSizeVideo = (props: ConstructorParameters<typeof Video>[0]) => {
  const [size, setSize] = useState(0)

  return (
    <View
      onLayout={e => {
        setSize(e.nativeEvent.layout.width)
      }}
    >
      <Video {...props} style={[props.style, { width: size, height: size }]} />
    </View>
  )
}

export default AutoSizeVideo
