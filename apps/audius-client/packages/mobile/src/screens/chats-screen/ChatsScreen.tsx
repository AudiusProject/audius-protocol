import { useEffect } from 'react'

import { chatActions, chatSelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, ScreenContent, Text } from 'app/components/core'

const { getChats, getChatMessages } = chatSelectors

export const ChatsScreen = () => {
  const dispatch = useDispatch()
  const chats = useSelector(getChats)
  const id = 'clbyghuy800003bat0th2ivy5'
  const messages = useSelector((state) => getChatMessages(state, id)) ?? []

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  useEffect(() => {
    dispatch(chatActions.fetchMoreMessages({ chatId: id }))
  }, [dispatch])

  return (
    <Screen>
      <ScreenContent>
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
      </ScreenContent>
    </Screen>
  )
}
