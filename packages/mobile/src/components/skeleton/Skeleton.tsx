import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

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
    skeleton: {
      width: '100%',
      height: '100%',
      backgroundColor: themeColors.skeleton,
      borderRadius: 4
    }
  })

const Skeleton = ({ width, height, style }: SkeletonProps) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height
        },
        style
      ]}
    />
  )
}

export default Skeleton
