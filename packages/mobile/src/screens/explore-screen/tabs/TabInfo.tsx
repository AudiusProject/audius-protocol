import React from 'react'

import { StyleSheet, Text, View } from 'react-native'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { ThemeColors } from 'app/utils/theme'

type Props = {
  header: string
  text?: string
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    infoContainer: {
      backgroundColor: themeColors.white,
      display: 'flex',
      padding: 16,
      paddingLeft: 28,
      paddingRight: 28,
      shadowOffset: { height: 10, width: 0 },
      shadowRadius: 15,
      shadowColor: 'rgb(133,129,153)',
      shadowOpacity: 0.15
    },
    header: {
      color: themeColors.secondary,
      fontFamily: 'AvenirNextLTPro-Bold',
      fontSize: 20,
      letterSpacing: 0.25,
      lineHeight: 25
    },
    text: {
      color: themeColors.neutral,
      fontFamily: 'AvenirNextLTPro-Regular',
      fontSize: 16,
      fontWeight: '500',
      letterSpacing: 0,
      lineHeight: 23,
      marginTop: 6
    }
  })

export const TabInfo = ({ header, text }: Props) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.infoContainer}>
      <Text style={styles.header}>{header}</Text>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )
}
