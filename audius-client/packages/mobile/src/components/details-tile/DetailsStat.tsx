import { Pressable, StyleSheet } from 'react-native'

import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import { flexRowCentered } from 'app/styles'
import { formatCount } from 'app/utils/format'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

type DetailsTileStatProps = {
  count: number
  onPress?: () => void
  renderLabel: (color: string) => JSX.Element
  size?: number
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    countContainer: {
      ...flexRowCentered(),
      marginHorizontal: 12,
      paddingVertical: 4,
      paddingHorizontal: 8
    },

    count: {
      fontSize: 16,
      color: themeColors.neutral,
      textAlign: 'center',
      marginRight: 3
    }
  })

export const DetailsTileStat = ({
  count,
  onPress,
  renderLabel
}: DetailsTileStatProps) => {
  const styles = useThemedStyles(createStyles)
  const { neutralLight4 } = useThemeColors()

  return (
    <Pressable style={styles.countContainer} onPress={onPress}>
      <Text style={styles.count} weight='bold'>
        {formatCount(count)}
      </Text>
      {renderLabel(neutralLight4)}
    </Pressable>
  )
}
