import { useCallback } from 'react'

import { useCanSendChatBlast } from '@audius/common/hooks'
import { chatActions } from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { TouchableHighlight } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'

import {
  Box,
  Flex,
  Text,
  IconTowerBroadcast,
  IconCaretRight
} from '@audius/harmony-native'

const { createChatBlast } = chatActions

const getMessages = (audience: ChatBlastAudience) => {
  switch (audience) {
    case ChatBlastAudience.FOLLOWERS:
      return {
        title: 'Message Blast Your Followers',
        description: 'Send bulk messages to your followers.'
      }
    case ChatBlastAudience.TIPPERS:
      return {
        title: 'Message Blast Your Tip Supporters',
        description: 'Bulk message everyone who’s sent you a tip.'
      }
  }
}

type ChatBlastWithAudienceCTAProps = {
  audience: ChatBlastAudience
}

export const ChatBlastWithAudienceCTA = (
  props: ChatBlastWithAudienceCTAProps
) => {
  const { audience } = props
  const messages = getMessages(audience)

  const dispatch = useDispatch()
  const handlePress = useCallback(() => {
    dispatch(createChatBlast({ audience }))
  }, [audience, dispatch])

  const userMeetsRequirements = useCanSendChatBlast()
  if (!userMeetsRequirements || !messages) {
    return null
  }

  return (
    <TouchableHighlight onPress={handlePress}>
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
  )
}
