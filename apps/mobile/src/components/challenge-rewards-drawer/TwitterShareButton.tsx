import React, { useCallback } from 'react'

import { Linking, StyleSheet } from 'react-native'
import type { Color } from 'react-native-svg'

import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import Button from 'app/components/button'
import { useThemedStyles } from 'app/hooks/useThemedStyles'
import type { ThemeColors } from 'app/utils/theme'
import { getTwitterLink } from 'app/utils/twitter'

const makeStyles = (themeColors: ThemeColors) =>
  StyleSheet.create({
    button: {
      padding: 12
    },
    container: {
      width: '100%',
      marginBottom: 8,
      backgroundColor: themeColors.staticTwitterBlue
    },
    text: {
      fontSize: 18
    }
  })

const renderIcon = (color: Color) => (
  <IconTwitterBird fill={'white'} width={24} height={24} />
)

const messages = {
  buttonTitleFriends: 'Share Invite With Your Friends',
  buttonTitleFans: 'Share Invite With Your Fans',
  twitterCopy: `Come support me on @audiusproject! Use my link and we both earn $AUDIO when you sign up.\n\n #audius #audiorewards\n\n`
}

export const TwitterShareButton = ({
  isVerified,
  inviteUrl
}: {
  isVerified: boolean
  inviteUrl: string
}) => {
  const styles = useThemedStyles(makeStyles)
  const onClick = useCallback(async () => {
    const twitterShareUrl = getTwitterLink(inviteUrl, messages.twitterCopy)
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
