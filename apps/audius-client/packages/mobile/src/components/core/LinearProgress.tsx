import { useCallback, useEffect, useRef, useState } from 'react'

import type { LayoutChangeEvent, ViewStyle } from 'react-native'
import { Animated, View } from 'react-native'

import type { StylesProp } from 'app/styles'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    height: spacing(2),
    flexGrow: 1,
    borderRadius: 4,
    backgroundColor: palette.progressBackground,
    overflow: 'hidden'
  },
  progressBar: {
    height: spacing(2),
    borderRadius: 4,
    backgroundColor: palette.secondary
  }
}))

type LinearProgressProps = {
  value: number
  styles?: StylesProp<{
    root: ViewStyle
    progress: ViewStyle
  }>
}

export const LinearProgress = (props: LinearProgressProps) => {
  const { value, styles: stylesProp } = props
  const styles = useStyles()
  const [barWidth, setBarWidth] = useState(0)
  const progress = useRef(new Animated.Value(value))
  const progressBarStyles = {
    transform: [
      {
        translateX: progress.current.interpolate({
          inputRange: [0, 100],
          outputRange: [-barWidth, 0]
        })
      }
    ]
  }

  const handleGetBarWidth = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout
    setBarWidth(width)
  }, [])

  useEffect(() => {
    Animated.timing(progress.current, {
      toValue: value,
      duration: 400,
      useNativeDriver: true
    }).start()
  }, [value])

  return (
    <View style={[styles.root, stylesProp?.root]} onLayout={handleGetBarWidth}>
      <Animated.View
        style={[styles.progressBar, progressBarStyles, stylesProp?.progress]}
      />
    </View>
  )
}
