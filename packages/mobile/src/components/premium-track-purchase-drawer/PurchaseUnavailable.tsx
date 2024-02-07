import React from 'react'

import { View } from 'react-native'

import { IconError } from '@audius/harmony-native'
import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useColor } from 'app/utils/theme'

const messages = {
  unavailable:
    "Unfortunately, you can't make purchases on this device. To continue, please use your browser."
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  container: {
    ...flexRowCentered(),
    width: '100%',
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(4),
    gap: spacing(4),
    borderColor: palette.borderStrong,
    borderRadius: spacing(2),
    borderWidth: 1,
    backgroundColor: palette.backgroundSurface2
  },
  textContainer: {
    flexShrink: 1
  },
  disclaimer: {
    lineHeight: 20
  }
}))

export const PurchaseUnavailable = () => {
  const styles = useStyles()
  const neutral = useColor('neutral')

  return (
    <View style={styles.container}>
      <IconError fill={neutral} width={spacing(6)} height={spacing(6)} />
      <View style={styles.textContainer}>
        <Text style={styles.disclaimer}>{messages.unavailable}</Text>
      </View>
    </View>
  )
}
