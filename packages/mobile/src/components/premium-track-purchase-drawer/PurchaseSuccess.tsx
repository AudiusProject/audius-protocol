import { useCallback } from 'react'

import type { UserTrackMetadata } from '@audius/common'
import { View } from 'react-native'

import IconVerified from 'app/assets/images/iconVerified.svg'
import { Text } from 'app/components/core'
import { flexRowCentered, makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { EventNames } from 'app/types/analytics'
import { useThemeColors } from 'app/utils/theme'

import { TwitterButton } from '../twitter-button'

const messages = {
  success: 'Your purchase was successful!',
  shareTwitterText: (trackTitle: string, handle: string, trackUrl: string) =>
    `I bought the track ${trackTitle} by ${handle} on Audius! #AudiusPremium ${trackUrl}`
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    paddingTop: spacing(2),
    gap: spacing(9),
    alignSelf: 'center'
  },
  successContainer: {
    ...flexRowCentered(),
    alignSelf: 'center',
    gap: spacing(2)
  }
}))

export const PurchaseSuccess = ({ track }: { track: UserTrackMetadata }) => {
  const styles = useStyles()
  const { specialGreen, staticWhite } = useThemeColors()
  const { handle } = track.user
  const { permalink, title } = track

  const handleTwitterShare = useCallback(
    (handle: string) => {
      const shareText = messages.shareTwitterText(title, handle, permalink)
      return {
        shareText,
        analytics: {
          eventName: EventNames.PURCHASE_CONTENT_TWITTER_SHARE,
          text: shareText
        } as const
      }
    },
    [permalink, title]
  )

  return (
    <View style={styles.root}>
      <View style={styles.successContainer}>
        <IconVerified
          height={spacing(4)}
          width={spacing(4)}
          fill={specialGreen}
          fillSecondary={staticWhite}
        />
        <Text weight='bold'>{messages.success}</Text>
      </View>
      <TwitterButton
        fullWidth
        type='dynamic'
        shareData={handleTwitterShare}
        handle={handle}
        size='large'
      />
    </View>
  )
}
