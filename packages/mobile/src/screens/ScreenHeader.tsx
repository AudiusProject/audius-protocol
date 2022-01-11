import React from 'react'

import { StyleSheet, View } from 'react-native'

import GradientText from 'app/components/gradient-text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

type Props = {
  text: string
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    headerContainer: {
      backgroundColor: themeColors.white,
      height: 52,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.neutralLight8
    },
    header: {
      fontSize: 24,
      marginLeft: 12,
      lineHeight: 52,
      textShadowOffset: { height: 2 },
      textShadowRadius: 4,
      textShadowColor: 'rgba(162,47,235,0.2)'
    }
  })

export const ScreenHeader = ({ text }: Props) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.headerContainer}>
      <GradientText style={styles.header} text={text} />
    </View>
  )
}
