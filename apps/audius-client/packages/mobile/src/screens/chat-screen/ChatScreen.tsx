import { useEffect, useState } from 'react'

import {
  chatActions,
  chatSelectors,
  encodeUrlName,
  Status,
  hasTail
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconSend from 'app/assets/images/iconSend.svg'
import { TextInput, Screen, FlatList, ScreenContent } from 'app/components/core'
import LoadingSpinner from 'app/components/loading-spinner'
import { ProfilePicture } from 'app/components/user'
import { UserBadges } from 'app/components/user-badges'
import { useRoute } from 'app/hooks/useRoute'
import { makeStyles } from 'app/styles'
import { useThemePalette } from 'app/utils/theme'

import { ChatMessageListItem } from './ChatMessageListItem'

const { getChatMessages, getOtherChatUsers, getChatMessagesStatus } =
  chatSelectors
const { fetchMoreMessages } = chatActions

const messages = {
  title: 'Messages',
  startNewMessage: 'Start a New Message'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  rootContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between'
  },
  listContainer: {
    display: 'flex',
    width: '100%',
    flex: 1
  },
  flatListContainer: {
    paddingHorizontal: spacing(6),
    display: 'flex',
    flexDirection: 'column-reverse'
  },
  composeView: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    backgroundColor: palette.white,
    borderTopWidth: 1,
    borderColor: palette.neutralLight8
  },
  composeTextContainer: {
    backgroundColor: palette.neutralLight10,
    borderRadius: spacing(1),
    paddingLeft: spacing(4),
    paddingRight: spacing(4),
    display: 'flex',
    alignItems: 'flex-end'
  },
  composeTextInput: {
    lineHeight: spacing(4),
    fontSize: typography.fontSize.medium,
    alignSelf: 'center'
  },
  icon: {
    marginBottom: 2,
    width: spacing(5),
    height: spacing(5),
    fill: palette.primary
  },
  userBadgeTitle: {
    fontSize: typography.fontSize.medium,
    fontWeight: '800',
    color: palette.neutral
  },
  profilePicture: {
    width: spacing(6),
    height: spacing(6),
    marginRight: spacing(2)
  }
}))

export const ChatScreen = () => {
  const styles = useStyles()
  const palette = useThemePalette()
  const dispatch = useDispatch()

  const { params } = useRoute<'Chat'>()
  const { chatId } = params
  const url = `/chat/${encodeUrlName(chatId)}`
  const [iconOpacity, setIconOpacity] = useState(0.5)
  const [text, setText] = useState('')

  const chatMessages = useSelector((state) =>
    getChatMessages(state, chatId ?? '')
  )
  const status = useSelector((state) =>
    getChatMessagesStatus(state, chatId ?? '')
  )

  useEffect(() => {
    dispatch(fetchMoreMessages({ chatId }))
  }, [dispatch, chatId])

  const [otherUser] = useSelector((state) => getOtherChatUsers(state, chatId))

  return (
    <Screen
      url={url}
      headerTitle={
        otherUser
          ? () => (
              <>
                <ProfilePicture
                  profile={otherUser}
                  style={styles.profilePicture}
                />
                <UserBadges
                  user={otherUser}
                  nameStyle={styles.userBadgeTitle}
                />
              </>
            )
          : messages.title
      }
    >
      <ScreenContent>
        <View style={styles.rootContainer}>
          {status === Status.SUCCESS ? (
            <View style={styles.listContainer}>
              <FlatList
                contentContainerStyle={styles.flatListContainer}
                data={chatMessages}
                keyExtractor={(message) => message.chat_id}
                renderItem={({ item, index }) => {
                  return (
                    <ChatMessageListItem
                      message={item}
                      hasTail={hasTail(item, chatMessages[index - 1])}
                    />
                  )
                }}
              />
            </View>
          ) : (
            <LoadingSpinner />
          )}
          <View style={styles.composeView}>
            <TextInput
              placeholder={messages.startNewMessage}
              Icon={() => (
                <IconSend
                  fill={palette.primary}
                  width={styles.icon.width}
                  height={styles.icon.height}
                  opacity={iconOpacity}
                />
              )}
              styles={{
                root: styles.composeTextContainer,
                input: styles.composeTextInput
              }}
              onChangeText={(text) => {
                setText(text)
                text ? setIconOpacity(1) : setIconOpacity(0.5)
              }}
              onBlur={() => setIconOpacity(0.5)}
              multiline
              value={text}
            />
          </View>
        </View>
      </ScreenContent>
    </Screen>
  )
}
