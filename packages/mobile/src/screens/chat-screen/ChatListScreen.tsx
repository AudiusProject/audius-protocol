import { useEffect } from 'react'

import { chatActions, chatSelectors, Status } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Screen, FlatList, ScreenContent } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { makeStyles } from 'app/styles'

import { ChatListItem } from './ChatListItem'

const { getChats, getChatsStatus } = chatSelectors

const messages = {
  title: 'Messages'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    justifyContent: 'center',
    height: '100%'
  },
  loadingSpinner: {
    height: spacing(20),
    width: spacing(20),
    alignSelf: 'center'
  }
}))

export const ChatListScreen = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const chats = useSelector(getChats)
  const chatsStatus = useSelector(getChatsStatus)

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  return (
    <Screen url='/chat' title={messages.title} topbarRight={null}>
      <ScreenContent>
        <View style={styles.rootContainer}>
          {chatsStatus === Status.SUCCESS ? (
            <FlatList
              data={chats}
              renderItem={({ item, index }) => <ChatListItem chat={item} />}
              keyExtractor={(item) => item.chat_id}
            />
          ) : (
            <LoadingSpinner style={styles.loadingSpinner} />
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
