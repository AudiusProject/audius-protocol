import { useSupporterPrompt } from '@audius/common/hooks'
import { StringKeys } from '@audius/common/services'
import { formatWei } from '@audius/common/utils'
import { Platform, Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { IconTrophy } from '@audius/harmony-native'
import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  becomeFirstSupporter: 'Tip to become their first supporter',
  becomeFirstSupporterAlt: 'Send $AUDIO to become their first supporter', // iOS only
  becomeTopSupporterPrefix: 'Tip ',
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

type SupporterPromptProps = {
  receiverId?: number | null
}

export const SupporterPrompt = ({ receiverId }: SupporterPromptProps) => {
  const styles = useStyles()
  const { white, pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()
  const { amountToDethrone, isFirstSupporter, isPending } =
    useSupporterPrompt(receiverId)
  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )

  if (isPending) return null

  if (!audioFeaturesDegradedText && !isFirstSupporter && !amountToDethrone)
    return null

  const isIOS = Platform.OS === 'ios'

  return (
    <LinearGradient
      style={styles.root}
      colors={[pageHeaderGradientColor2, pageHeaderGradientColor1]}
    >
      <IconTrophy fill={white} width={16} height={16} />
      <Text style={styles.text}>
        {audioFeaturesDegradedText ||
          (isFirstSupporter ? (
            isIOS ? (
              messages.becomeFirstSupporterAlt
            ) : (
              messages.becomeFirstSupporter
            )
          ) : (
            <>
              {isIOS
                ? messages.becomeTopSupporterPrefixAlt
                : messages.becomeTopSupporterPrefix}
              {formatWei(amountToDethrone!, true, 0)}
              {messages.becomeTopSupporterSuffix}
            </>
          ))}
      </Text>
    </LinearGradient>
  )
}
