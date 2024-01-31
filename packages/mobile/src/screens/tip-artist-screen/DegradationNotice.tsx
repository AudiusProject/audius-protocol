import React from 'react'

import { StringKeys } from '@audius/common/services'
import { Text } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import { useRemoteVar } from 'app/hooks/useRemoteConfig'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginTop: -48, // TipScreen has paddingVertical 60
    marginBottom: spacing(12),
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
    fontFamily: typography.fontByWeight.demiBold,
    lineHeight: typography.fontSize.medium * 1.3
  }
}))

export const DegradationNotice = () => {
  const styles = useStyles()
  const { pageHeaderGradientColor1, pageHeaderGradientColor2 } =
    useThemeColors()

  const audioFeaturesDegradedText = useRemoteVar(
    StringKeys.AUDIO_FEATURES_DEGRADED_TEXT
  )
  return audioFeaturesDegradedText ? (
    <LinearGradient
      style={styles.root}
      colors={[pageHeaderGradientColor1, pageHeaderGradientColor2]}
      useAngle
      angle={350}
    >
      <Text style={styles.text}>{audioFeaturesDegradedText}</Text>
    </LinearGradient>
  ) : null
}
