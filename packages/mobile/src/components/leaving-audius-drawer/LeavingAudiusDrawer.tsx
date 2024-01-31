import React from 'react'

import { useLeavingAudiusModal } from '@audius/common/store'
import { View } from 'react-native'

import { IconExternalLink, IconInfo } from '@audius/harmony-native'
import { Button, Text, useLink } from 'app/components/core'
import Drawer from 'app/components/drawer/Drawer'
import { makeStyles } from 'app/styles'

import { HelpCallout } from '../help-callout/HelpCallout'

const messages = {
  title: 'Are You Sure?',
  content: 'This link is taking you to the following website',
  visit: 'Visit Site',
  back: 'Go Back'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    gap: spacing(4),
    paddingBottom: spacing(6),
    paddingHorizontal: spacing(4)
  }
}))

export const LeavingAudiusDrawer = () => {
  const styles = useStyles()
  const { isOpen, data, onClose, onClosed } = useLeavingAudiusModal()
  const { link } = data
  const { onPress: onLinkPress } = useLink(link)
  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
      title={messages.title}
      titleIcon={IconInfo}
    >
      <View style={styles.root}>
        <Text>{messages.content}</Text>
        <HelpCallout
          numberOfLines={10}
          content={link}
          icon={IconExternalLink}
        />
        <Button title={messages.visit} onPress={onLinkPress} fullWidth />
        <Button
          variant='common'
          title={messages.back}
          onPress={onClose}
          fullWidth
        />
      </View>
    </Drawer>
  )
}
