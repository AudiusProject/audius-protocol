import { Platform, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { IconTrophy } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  becomeFirstSupporter: 'Tip to become their first supporter',
  // NOTE: Send tip -> Send $AUDIO change
  becomeFirstSupporterAlt: 'Send $AUDIO to become their first supporter' // iOS only
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginBottom: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: 4
  },
  text: {
    marginLeft: spacing(3.5),
    color: palette.white,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.demiBold
  }
}))

export const BecomeFirstSupporter = () => {
  const styles = useStyles()
  const { white, pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  return (
    <LinearGradient
      style={styles.root}
      colors={[pageHeaderGradientColor2, pageHeaderGradientColor1]}
    >
      <IconTrophy fill={white} width={16} height={16} />
      <Text style={styles.text}>
        {Platform.OS === 'ios'
          ? messages.becomeFirstSupporterAlt
          : messages.becomeFirstSupporter}
      </Text>
    </LinearGradient>
  )
}
