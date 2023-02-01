import { useEffect } from 'react'

import { chatActions, chatSelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, ScrollView, ScreenContent } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { ChatListItem } from './ChatListItem'

const { getChats } = chatSelectors

const messages = {
  title: 'Messages'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  chatRow: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  loadingSpinner: {
    height: spacing(20),
    widht: spacing(20)
  }
}))

export const ChatListScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const chats = useSelector(getChats)

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  return (
    <Screen url='/chat' title={messages.title} topbarRight={null}>
      <ScreenContent>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.chatRow}>
            {chats.length > 0 ? (
              chats.map((chat) => {
                return <ChatListItem key={chat.chat_id} chat={chat} />
              })
            ) : (
              <LoadingSpinner style={styles.loadingSpinner} />
            )}
          </View>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
