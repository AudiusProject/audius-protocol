import { useState } from 'react'

import { View } from 'react-native'
import type { ReactVideoProps } from 'react-native-video'
import Video from 'react-native-video'

type AutoSizeVideoProps = ReactVideoProps

const AutoSizeVideo = (props: AutoSizeVideoProps) => {
  const [size, setSize] = useState(0)

  return (
    <View
      onLayout={(e) => {
        setSize(e.nativeEvent.layout.width)
      }}
    >
      <Video {...props} style={[props.style, { width: size, height: size }]} />
    </View>
  )
}

export default AutoSizeVideo
