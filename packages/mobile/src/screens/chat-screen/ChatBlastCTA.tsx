import React, { useCallback } from 'react'

import { useCanSendChatBlast } from '@audius/common/hooks'
import { TouchableHighlight } from 'react-native-gesture-handler'

import {
  Box,
  Flex,
  Text,
  IconTowerBroadcast,
  IconCaretRight
} from '@audius/harmony-native'
import { KeyboardAvoidingView } from 'app/components/core'
import { PLAY_BAR_HEIGHT } from 'app/components/now-playing-drawer/constants'

import { useAppDrawerNavigation } from '../app-drawer-screen'

import { useKeyboardAvoidingPlaybarStyle } from './hooks/useKeyboardAvoidingPlaybarStyle'

const CTA_HEIGHT = 80

const messages = {
  title: 'Send a Message Blast',
  description: 'Send messages to your fans in bulk.',
  badgeRequired: 'Badge Required',
  or: 'or'
}

export const ChatBlastCTA = () => {
  const navigation = useAppDrawerNavigation()
  const keyboardAvoidingPlaybarStyle = useKeyboardAvoidingPlaybarStyle()

  const handleClick = useCallback(() => {
    navigation.navigate('CreateChatBlast')
  }, [navigation])

  const userMeetsRequirements = useCanSendChatBlast()
  if (!userMeetsRequirements) {
    return null
  }

  return (
    <KeyboardAvoidingView
      keyboardShowingOffset={CTA_HEIGHT + PLAY_BAR_HEIGHT}
      style={keyboardAvoidingPlaybarStyle}
    >
      <TouchableHighlight onPress={handleClick}>
        <Box backgroundColor='surface1' ph='xl' pv='l' borderTop='strong'>
          <Flex
            direction='row'
            alignItems='center'
            gap='l'
            justifyContent='space-between'
          >
            <Flex direction='row' alignItems='center' gap='s'>
              <IconTowerBroadcast size='3xl' color='default' />
              <Flex direction='column' gap='xs'>
                <Text variant='title'>{messages.title}</Text>
                <Text size='s'>{messages.description}</Text>
              </Flex>
            </Flex>
            <IconCaretRight size='s' color='default' />
          </Flex>
        </Box>
      </TouchableHighlight>
    </KeyboardAvoidingView>
  )
}
