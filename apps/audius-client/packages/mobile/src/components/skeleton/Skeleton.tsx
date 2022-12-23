import { useEffect, useState } from 'react'

import type { StyleProp, ViewStyle } from 'react-native'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

const ANIMATION_DURATION_MS = 1500

type SkeletonProps = {
  // Width (css string) of the skeleton to display. Default 100%.
  width?: string
  // Height (css string) of the skeleton to display. Default 100%.
  height?: string
  // Optional style to pass in and override styles with
  style?: StyleProp<ViewStyle>
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: 4
    },
    skeleton: {
      position: 'absolute',
      width: '400%',
      height: '100%',
      backgroundColor: themeColors.skeleton
    }
  })

const Skeleton = ({ width, height, style }: SkeletonProps) => {
  const styles = useThemedStyles(createStyles)
  const [shimmerWidth, setShimmerWidth] = useState(0)
  const [shimmerPos, setShimmerPos] = useState(new Animated.Value(0))
  const { skeleton, skeletonHighlight } = useThemeColors()

  useEffect(() => {
    if (shimmerWidth !== 0) {
      Animated.loop(
        Animated.timing(shimmerPos, {
          toValue: 0,
          duration: ANIMATION_DURATION_MS,
          useNativeDriver: true,
          easing: Easing.ease
        })
      ).start()
    }
  }, [shimmerPos, shimmerWidth])

  return (
    <View style={[styles.view, { height, width }, style]}>
      <Animated.View
        onLayout={(e) => {
          const { width } = e.nativeEvent.layout
          setShimmerWidth(width)
          setShimmerPos(new Animated.Value(-0.75 * width))
        }}
        style={[styles.skeleton, { transform: [{ translateX: shimmerPos }] }]}
      >
        <LinearGradient
          useAngle
          angle={90}
          locations={[0, 0.32, 0.46, 0.54, 0.68, 1]}
          colors={[
            skeleton,
            skeleton,
            skeletonHighlight,
            skeletonHighlight,
            skeleton,
            skeleton
          ]}
          style={{ height: '100%', width: '100%' }}
        />
      </Animated.View>
    </View>
  )
}

type StaticSkeletonProps = SkeletonProps

export const StaticSkeleton = (props: StaticSkeletonProps) => {
  return <Skeleton noShimmer {...props} />
}

export default Skeleton
