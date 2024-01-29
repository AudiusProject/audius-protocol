import React, { useCallback } from 'react'

import { makeTwitterShareUrl } from '@audius/common'
import { Linking } from 'react-native'

import { IconTwitter } from '@audius/harmony-native'
import Button from 'app/components/button'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette }) => ({
  button: {
    padding: 12
  },
  container: {
    width: '100%',
    marginBottom: 8,
    backgroundColor: palette.staticTwitterBlue
  },
  text: {
    fontSize: 18
  }
}))

const renderIcon = () => <IconTwitter fill={'white'} width={24} height={24} />

const messages = {
  buttonTitleFriends: 'Share Invite With Your Friends',
  buttonTitleFans: 'Share Invite With Your Fans',
  twitterCopy: `Come support me on @audius! Use my link and we both earn $AUDIO when you sign up.\n\n #audius #audiorewards\n\n`
}

export const TwitterShareButton = ({
  isVerified,
  inviteUrl
}: {
  isVerified: boolean
  inviteUrl: string
}) => {
  const styles = useStyles()
  const onClick = useCallback(async () => {
    const twitterShareUrl = makeTwitterShareUrl(inviteUrl, messages.twitterCopy)
    const isSupported = await Linking.canOpenURL(twitterShareUrl)
    if (isSupported) {
      Linking.openURL(twitterShareUrl)
    } else {
      console.error(`Can't open: ${twitterShareUrl}`)
    }
  }, [inviteUrl])
  return (
    <Button
      containerStyle={styles.container}
      textStyle={styles.text}
      style={styles.button}
      iconPosition='left'
      renderIcon={renderIcon}
      onPress={onClick}
      title={
        isVerified ? messages.buttonTitleFans : messages.buttonTitleFriends
      }
      underlayColor={'rgba(0, 0, 0, 0.2)'}
    />
  )
}
