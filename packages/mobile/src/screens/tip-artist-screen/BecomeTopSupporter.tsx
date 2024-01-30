import type { BNWei } from '@audius/common/models'
import { formatWei } from '@audius/common/utils'
import { Platform, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import IconTrophy from 'app/assets/images/iconTrophy.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  becomeTopSupporterPrefix: 'Tip ',
  // NOTE: Send tip -> Send $AUDIO change
  becomeTopSupporterPrefixAlt: 'Send ', // iOS only
  becomeTopSupporterSuffix: ' $AUDIO to become their top supporter'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginBottom: spacing(6),
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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

type BecomeTopSupporterProps = {
  amountToTipToBecomeTopSupporter: BNWei
}

export const BecomeTopSupporter = ({
  amountToTipToBecomeTopSupporter
}: BecomeTopSupporterProps) => {
  const styles = useStyles()
  const { white, pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  return (
    <LinearGradient
      style={styles.root}
      colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
      useAngle
      angle={350}
    >
      <IconTrophy fill={white} width={16} height={16} />
      <Text style={styles.text}>
        {Platform.OS === 'ios'
          ? messages.becomeTopSupporterPrefixAlt
          : messages.becomeTopSupporterPrefix}
        {formatWei(amountToTipToBecomeTopSupporter, true, 0)}
        {messages.becomeTopSupporterSuffix}
      </Text>
    </LinearGradient>
  )
}
