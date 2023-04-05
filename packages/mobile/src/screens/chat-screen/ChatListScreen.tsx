import { useEffect } from 'react'

import { chatActions, chatSelectors, Status } from '@audius/common'
import { View, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconCompose from 'app/assets/images/iconCompose.svg'
import IconMessage from 'app/assets/images/iconMessage.svg'
import Button, { ButtonType } from 'app/components/button'
import { Screen, FlatList, ScreenContent } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { useNavigation } from 'app/hooks/useNavigation'
import type { AppTabScreenParamList } from 'app/screens/app-screen'
import { makeStyles } from 'app/styles'
import { useThemePalette, useColor } from 'app/utils/theme'

import { ChatListItem } from './ChatListItem'

const { getChats, getChatsStatus } = chatSelectors
const { fetchMoreChats, connect, disconnect } = chatActions

const messages = {
  title: 'Messages',
  startConversation: 'Start a Conversation!',
  connect:
    'Connect with other Audius users by\nstarting a private direct message!',
  writeMessage: 'Write a Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    flexGrow: 1
  },
  spinnerContainer: {
    height: spacing(28),
    padding: spacing(10)
  },
  loadingSpinner: {
    height: spacing(20),
    width: spacing(20),
    alignSelf: 'center'
  },
  listContainer: {
    display: 'flex',
    minHeight: '100%'
  },
  startConversationContainer: {
    marginVertical: spacing(8),
    marginHorizontal: spacing(4),
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2),
    padding: spacing(6)
  },
  startConversationTitle: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.bold,
    textAlign: 'center',
    lineHeight: typography.fontSize.xxl * 1.3,
    color: palette.neutral
  },
  connect: {
    fontSize: typography.fontSize.medium,
    textAlign: 'center',
    lineHeight: typography.fontSize.medium * 1.3,
    color: palette.neutral,
    marginTop: spacing(2)
  },
  writeMessageButton: {
    marginTop: spacing(6)
  },
  shadow: {
    borderBottomColor: palette.neutralLight6,
    borderBottomWidth: 3,
    borderBottomLeftRadius: 1
  }
}))

const ChatsEmpty = ({ onPress }: { onPress: () => void }) => {
  const white = useColor('white')
  const styles = useStyles()
  return (
    <View style={styles.startConversationContainer}>
      <Text style={styles.startConversationTitle}>
        {messages.startConversation}
      </Text>
      <Text style={styles.connect}>{messages.connect}</Text>
      <Button
        title={messages.writeMessage}
        renderIcon={() => <IconCompose fill={white} />}
        iconPosition='left'
        onPress={onPress}
        containerStyle={styles.writeMessageButton}
        type={ButtonType.PRIMARY}
      />
    </View>
  )
}

export const ChatListScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()
  const navigation = useNavigation<AppTabScreenParamList>()
  const chats = useSelector(getChats)
  const chatsStatus = useSelector(getChatsStatus)

  useEffect(() => {
    dispatch(fetchMoreChats())
  }, [dispatch])

  useEffect(() => {
    dispatch(connect())
    return () => {
      dispatch(disconnect())
    }
  }, [dispatch])

  const navigateToChatUserList = () => navigation.navigate('ChatUserList')
  const iconCompose = (
    <IconCompose
      fill={palette.neutralLight4}
      onPress={navigateToChatUserList}
    />
  )

  return (
    <Screen
      url='/chat'
      title={messages.title}
      variant='secondary'
      icon={IconMessage}
      topbarRight={iconCompose}
    >
      <ScreenContent>
        <View style={styles.shadow} />
        <View style={styles.rootContainer}>
          {chatsStatus === Status.SUCCESS ? (
            <FlatList
              data={chats}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item, index }) => <ChatListItem chat={item} />}
              keyExtractor={(item) => item.chat_id}
              ListEmptyComponent={() => (
                <ChatsEmpty onPress={navigateToChatUserList} />
              )}
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
