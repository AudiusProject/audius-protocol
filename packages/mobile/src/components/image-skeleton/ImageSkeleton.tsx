import React from 'react'

import { ViewStyle } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useThemeColors } from 'app/utils/theme'

type ImageSkeletonProps = {
  styles: {
    root: ViewStyle
  }
}

export const ImageSkeleton = ({ styles }: ImageSkeletonProps) => {
  const { neutralLight8, neutralLight9 } = useThemeColors()
  return (
    <LinearGradient
      colors={[neutralLight8, neutralLight9]}
      start={{ x: 1, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={styles.root}
    />
  )
}
