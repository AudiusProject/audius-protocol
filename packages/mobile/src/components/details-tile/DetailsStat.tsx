import { Pressable } from 'react-native'

import Text from 'app/components/text'
import { flexRowCentered, makeStyles } from 'app/styles'
import { formatCount } from 'app/utils/format'
import { useThemeColors } from 'app/utils/theme'

type DetailsTileStatProps = {
  count: number
  onPress?: () => void
  renderLabel: (color: string) => JSX.Element
  size?: number
}

const useStyles = makeStyles(({ palette, typography }) => ({
  countContainer: {
    ...flexRowCentered(),
    marginHorizontal: 12,
    paddingVertical: 4,
    paddingHorizontal: 8
  },

  count: {
    fontSize: typography.fontSize.medium,
    color: palette.neutral,
    textAlign: 'center',
    marginRight: 3
  }
}))

export const DetailsTileStat = ({
  count,
  onPress,
  renderLabel
}: DetailsTileStatProps) => {
  const styles = useStyles()
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
