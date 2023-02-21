import { useEffect } from 'react'

import { chatActions, chatSelectors, Status } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCompose from 'app/assets/images/iconCompose.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import { Screen, FlatList, ScreenContent } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { ChatListItem } from './ChatListItem'

const { getChats, getChatsStatus } = chatSelectors

const messages = {
  title: 'Messages'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexGrow: 1
  },
  spinnerContainer: {
    height: spacing(28)
  },
  loadingSpinner: {
    height: spacing(20),
    width: spacing(20),
    alignSelf: 'center'
  }
}))

export const ChatListScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()
  const navigation = useNavigation<AppTabScreenParamList>()
  const chats = useSelector(getChats)
  const chatsStatus = useSelector(getChatsStatus)

  useEffect(() => {
    dispatch(chatActions.fetchMoreChats())
  }, [dispatch])

  const iconCompose = (
    <IconCompose
      fill={palette.neutralLight4}
      onPress={() => navigation.navigate('ChatUserList')}
    />
  )

  return (
    <Screen
      url='/chat'
      title={messages.title}
      icon={IconMessage}
      topbarRight={iconCompose}
    >
      <ScreenContent>
        <View style={styles.rootContainer}>
          {chatsStatus === Status.SUCCESS ? (
            <FlatList
              data={chats}
              renderItem={({ item, index }) => <ChatListItem chat={item} />}
              keyExtractor={(item) => item.chat_id}
            />
          ) : (
            <View style={styles.spinnerContainer}>
              <LoadingSpinner style={styles.loadingSpinner} />
            </View>
          )}
        </View>
      </ScreenContent>
    </Screen>
  )
}
