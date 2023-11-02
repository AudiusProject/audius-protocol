import { useCallback, type ReactNode } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { View, TouchableOpacity } from 'react-native'

import IconCopy2 from 'app/assets/images/iconCopy2.svg'
import { Text } from 'app/components/core'
import { useToast } from 'app/hooks/useToast'
import { make, track as trackEvent } from 'app/services/analytics'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import type { AllEvents } from 'app/types/analytics'
import { useColor } from 'app/utils/theme'

const messages = {
  copied: 'Copied to Clipboard!'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  addressContainer: {
    ...flexRowCentered(),
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: spacing(1),
    backgroundColor: palette.backgroundSurface
  },
  rightContainer: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6)
  },
  middleContainer: {
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(4),
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: palette.borderDefault,
    flexShrink: 1,
    alignItems: 'center'
  },
  leftContainer: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6)
  }
}))

type AddressTileProps = {
  address: string
  left?: ReactNode
  right?: ReactNode
  analytics?: AllEvents
}

export const AddressTile = ({
  address,
  left,
  right,
  analytics
}: AddressTileProps) => {
  const styles = useStyles()
  const { toast } = useToast()
  const textSubdued = useColor('textIconSubdued')

  const handleCopyPress = useCallback(() => {
    Clipboard.setString(address)
    toast({ content: messages.copied, type: 'info' })
    if (analytics) trackEvent(make(analytics))
  }, [address, analytics, toast])

  return (
    <View style={styles.addressContainer}>
      <View style={styles.leftContainer}>{left}</View>
      <View style={styles.middleContainer}>
        <Text numberOfLines={1} ellipsizeMode='middle'>
          {address}
        </Text>
      </View>
      <View style={styles.rightContainer}>
        {right ?? (
          <TouchableOpacity onPress={handleCopyPress} hitSlop={spacing(6)}>
            <IconCopy2
              fill={textSubdued}
              width={spacing(4)}
              height={spacing(4)}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
