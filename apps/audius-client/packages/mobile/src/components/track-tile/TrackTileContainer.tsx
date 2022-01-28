import React, { ReactNode } from 'react'

import { StyleSheet, View } from 'react-native'
import { Shadow } from 'react-native-shadow-2'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      minHeight: 152,
      borderColor: themeColors.neutralLight8,
      backgroundColor: themeColors.white,
      borderWidth: 1,
      borderRadius: 8,
      maxWidth: 400,
      marginHorizontal: 'auto'
    },
    mainContent: {
      flex: 1
    }
  })

export const TrackTileContainer = ({ children }: { children: ReactNode }) => {
  const styles = useThemedStyles(createStyles)
  return (
    <Shadow
      offset={[0, 2]}
      viewStyle={{ alignSelf: 'stretch' }}
      distance={4}
      startColor='rgba(133,129,153,0.05)'
    >
      <View style={styles.container}>{children}</View>
    </Shadow>
  )
}
