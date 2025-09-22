import React, { useCallback } from 'react'

import { makeXShareUrl } from '@audius/common/utils'
import { Linking } from 'react-native'

import { Button, IconX } from '@audius/harmony-native'

const messages = {
  buttonTitleFriends: 'Share Invite With Your Friends',
  buttonTitleFans: 'Share Invite With Your Fans',
  xCopy: `Come support me on @audius! Use my link and we both earn $AUDIO when you sign up.\n\n`
}

export const XShareButton = ({
  isVerified,
  inviteUrl
}: {
  isVerified: boolean
  inviteUrl: string
}) => {
  const handlePress = useCallback(async () => {
    const xShareUrl = makeXShareUrl(inviteUrl, messages.xCopy)
    const isSupported = await Linking.canOpenURL(xShareUrl)
    if (isSupported) {
      Linking.openURL(xShareUrl)
    } else {
      console.error(`Can't open: ${xShareUrl}`)
    }
  }, [inviteUrl])

  return (
    <Button onPress={handlePress} color='blue' iconLeft={IconX} fullWidth>
      {isVerified ? messages.buttonTitleFans : messages.buttonTitleFriends}
    </Button>
  )
}
