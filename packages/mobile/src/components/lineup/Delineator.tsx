import { StyleSheet, View } from 'react-native'

import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import type { ThemeColors } from 'app/utils/theme'

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    root: {
      width: '100%',
      ...flexRowCentered(),
      justifyContent: 'center',
      marginTop: 12,
      paddingHorizontal: 12
    },

    line: {
      height: 2,
      flexGrow: 1,
      backgroundColor: themeColors.neutralLight7
    },

    box: {
      borderRadius: 4,
      backgroundColor: themeColors.neutralLight7,
      ...flexRowCentered(),
      height: 16,
      paddingHorizontal: 6
    },

    text: {
      color: themeColors.white,
      fontSize: 10,
      letterSpacing: 0.63,
      textTransform: 'uppercase',
      paddingHorizontal: 8
    }
  })

type DelineatorProps = {
  text?: string
}

export const Delineator = ({ text }: DelineatorProps) => {
  const styles = useThemedStyles(createStyles)

  return (
    <View style={styles.root}>
      <View style={styles.line} />
      {!text ? null : (
        <View style={styles.box}>
          <Text style={styles.text} weight='bold'>
            {text}
          </Text>
        </View>
      )}
      <View style={styles.line} />
    </View>
  )
}
