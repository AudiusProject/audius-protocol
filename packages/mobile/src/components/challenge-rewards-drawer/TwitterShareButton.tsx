import React, { useCallback } from 'react'

import { makeTwitterShareUrl } from '@audius/common/utils'
import { Linking } from 'react-native'

import { Button, IconTwitter } from '@audius/harmony-native'

const messages = {
  buttonTitleFriends: 'Share Invite With Your Friends',
  buttonTitleFans: 'Share Invite With Your Fans',
  twitterCopy: `Come support me on @audius! Use my link and we both earn $AUDIO when you sign up.\n\n #Audius #AudioRewards\n\n`
}

export const TwitterShareButton = ({
  isVerified,
  inviteUrl
}: {
  isVerified: boolean
  inviteUrl: string
}) => {
  const handlePress = useCallback(async () => {
    const twitterShareUrl = makeTwitterShareUrl(inviteUrl, messages.twitterCopy)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
  }, [inviteUrl])
  return (
    <Button onPress={handlePress} color='blue' iconLeft={IconTwitter} fullWidth>
      {isVerified ? messages.buttonTitleFans : messages.buttonTitleFriends}
    </Button>
  )
}
