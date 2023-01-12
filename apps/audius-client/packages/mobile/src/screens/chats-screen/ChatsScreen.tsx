import { useEffect } from 'react'

import { chatActions, chatSelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, Text } from 'app/components/core'

export const ChatsScreen = () => {
  const dispatch = useDispatch()
  const { data: chats } = useSelector(chatSelectors.getChats)
  const id = 'clbyghuy800003bat0th2ivy5'
  const messages =
    useSelector((state) => chatSelectors.getChatMessages(state, id)) ?? []

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  useEffect(() => {
    dispatch(chatActions.fetchNewChatMessages({ chatId: id }))
  }, [dispatch])

  return (
    <Screen>
      <View>
        <Text>You have {chats?.length} chats:</Text>
        {messages.map((message) => {
          return (
            <View key={message.message_id}>
              <Text>{message.sender_user_id} says:</Text>
              <Text>{message.message}</Text>
              <Text>{message.created_at}</Text>
            </View>
          )
        })}
      </View>
    </Screen>
  )
}
