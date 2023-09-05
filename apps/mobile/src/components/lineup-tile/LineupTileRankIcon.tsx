import { StyleSheet, View } from 'react-native'

import IconCrown from 'app/assets/images/iconCrown.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import Text from 'app/components/text'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { useThemeColors } from 'app/utils/theme'

import { createStyles as createTrackTileStyles } from './styles'

type Props = {
  /** Whether or not to show the crown icon */
  showCrown?: boolean
  /** Index of this item in the lineup */
  index: number
}

const createStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    text: {
      color: themeColors.secondary
    },
    icon: {
      marginRight: 4
    }
  })

export const LineupTileRankIcon = ({ showCrown, index }: Props) => {
  const styles = useThemedStyles(createStyles)
  const trackTileStyles = useThemedStyles(createTrackTileStyles)
  const { secondary } = useThemeColors()
  const Icon = showCrown ? IconCrown : IconTrending
  return (
    <View style={trackTileStyles.statItem}>
      <Icon fill={secondary} style={styles.icon} height={14} width={14} />
      <Text style={[trackTileStyles.statText, styles.text]}>{index + 1}</Text>
    </View>
  )
}
