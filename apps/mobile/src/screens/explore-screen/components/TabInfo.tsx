import { StyleSheet, Text, View } from 'react-native'

import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { font } from 'app/styles'
import type { ThemeColors } from 'app/utils/theme'

type TabInfoProps = {
  header: string
  text?: string
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    infoContainer: {
      backgroundColor: themeColors.white,
      display: 'flex',
      padding: 16,
      paddingHorizontal: 28,
      shadowOffset: { height: 10, width: 0 },
      shadowRadius: 15,
      shadowColor: 'rgb(133,129,153)',
      shadowOpacity: 0.15
    },
    header: {
      ...font('bold'),
      color: themeColors.secondary,
      fontSize: 20,
      letterSpacing: 0.25,
      lineHeight: 25
    },
    text: {
      ...font('medium'),
      color: themeColors.neutral,
      fontSize: 16,
      letterSpacing: 0,
      lineHeight: 23,
      marginTop: 6
    }
  })

export const TabInfo = ({ header, text }: TabInfoProps) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.infoContainer}>
      <Text style={styles.header}>{header}</Text>
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  )
}
