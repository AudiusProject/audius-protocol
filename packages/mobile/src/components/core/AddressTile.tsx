import { useCallback, type ReactNode } from 'react'

import Clipboard from '@react-native-clipboard/clipboard'
import { View, TouchableOpacity } from 'react-native'

import { Text, IconCopy } from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'
import { make, track as trackEvent } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import type { AllEvents } from 'app/types/analytics'
import { useColor } from 'app/utils/theme'

const messages = {
  copied: 'Copied to Clipboard!'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    borderWidth: 1,
    borderColor: palette.borderDefault,
    borderRadius: spacing(1),
    flexDirection: 'column'
  },
  topContainer: {
    padding: spacing(4),
    flexDirection: 'row',
    gap: spacing(2),
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  bottomContainer: {
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing(2),
    borderColor: palette.borderDefault,
    backgroundColor: palette.backgroundSurface
  },
  address: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(6),
    flexShrink: 1
  },
  rightIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(4),
    borderLeftWidth: 1,
    borderLeftColor: palette.borderDefault
  }
}))

type AddressTileProps = {
  address: string
  title: string
  balance: string
  left?: ReactNode
  right?: ReactNode
  analytics?: AllEvents
}

export const AddressTile = ({
  address,
  title,
  balance,
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
    <View style={styles.root}>
      <View style={styles.topContainer}>
        <View>{left}</View>
        <Text style={styles.title} variant='title' size='m' strength='default'>
          {title}
        </Text>
        <Text variant='title' size='l' strength='strong'>{`$${balance}`}</Text>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.address}>
          <Text variant='body' numberOfLines={1} ellipsizeMode='middle'>
            {address}
          </Text>
        </View>
        <View style={styles.rightIcon}>
          {right ?? (
            <TouchableOpacity onPress={handleCopyPress} hitSlop={spacing(6)}>
              <IconCopy
                fill={textSubdued}
                width={spacing(4)}
                height={spacing(4)}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}
