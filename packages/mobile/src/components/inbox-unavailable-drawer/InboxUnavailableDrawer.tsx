import type { ReactNode } from 'react'
import { useCallback } from 'react'

import { useCurrentUserId, useUser } from '@audius/common/api'
import { FollowSource } from '@audius/common/models'
import {
  useInboxUnavailableModal,
  chatActions,
  chatSelectors,
  makeChatId,
  ChatPermissionAction,
  tippingActions,
  usersSocialActions
} from '@audius/common/store'
import { CHAT_BLOG_POST_URL } from '@audius/common/utils'
import type { Action } from '@reduxjs/toolkit'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import { IconMessageLocked, IconTipping, Button } from '@audius/harmony-native'
import { Text, useLink } from 'app/components/core'
import Drawer from 'app/components/drawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useColor } from 'app/utils/theme'

import { UserBadges } from '../user-badges'
const { followUser } = usersSocialActions

const { unblockUser, createChat } = chatActions
const { useCanCreateChat } = chatSelectors
const { beginTip } = tippingActions

const messages = {
  title: 'Inbox Unavailable',
  blockee: 'You cannot send messages to users you have blocked.',
  tipGated: (displayName: ReactNode) => (
    <>
      {'You must send '}
      {displayName}
      {' a tip before you can send them messages.'}
    </>
  ),
  followRequired: (displayName: ReactNode) => (
    <>
      {'You must follow '}
      {displayName}
      {' before you can send them messages.'}
    </>
  ),
  noAction: "You can't send messages to ",
  info: 'This will not affect their ability to view your profile or interact with your content.',
  unblockUser: 'Unblock User',
  learnMore: 'Learn More',
  sendAudio: 'Send $AUDIO',
  follow: 'Follow',
  cancel: 'Cancel'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    marginTop: spacing(2),
    marginBottom: spacing(5),
    padding: spacing(3.5),
    gap: spacing(4)
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(3.5),
    alignSelf: 'center'
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight2,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xl * 1.25
  },
  infoContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4.5),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    backgroundColor: palette.neutralLight9,
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: spacing(2)
  },
  callToActionText: {
    color: palette.neutral,
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.medium,
    lineHeight: typography.fontSize.large * 1.3,
    textAlign: 'center'
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  }
}))

type DrawerContentProps = {
  data: ReturnType<typeof useInboxUnavailableModal>['data']
  onClose: () => void
}

const DrawerContent = ({ data, onClose }: DrawerContentProps) => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const { data: currentUserId } = useCurrentUserId()
  const { userId, presetMessage } = data
  const { data: user } = useUser(userId)
  const { callToAction } = useCanCreateChat(userId)

  const handleUnblockPress = useCallback(() => {
    if (!userId) {
      console.error(
        'Unexpected undefined user in InboxUnavailableDrawer unblock'
      )
      return
    }
    dispatch(unblockUser({ userId }))
    dispatch(createChat({ userIds: [userId], presetMessage }))
    onClose()
  }, [dispatch, userId, presetMessage, onClose])

  const { onPress: onPressLearnMore } = useLink(CHAT_BLOG_POST_URL)
  const handleLearnMorePress = useCallback(() => {
    onPressLearnMore()
    onClose()
  }, [onClose, onPressLearnMore])

  const handleTipPress = useCallback(() => {
    if (!currentUserId || !user) {
      console.error(
        'Unexpected undefined currentUserId or user when starting tip'
      )
      return
    }
    const chatId = makeChatId([currentUserId, user.user_id])
    dispatch(
      beginTip({
        user,
        source: 'inboxUnavailableModal',
        onSuccessActions: [
          chatActions.goToChat({
            chatId,
            presetMessage
          })
        ],
        onSuccessConfirmedActions: [
          chatActions.createChat({
            userIds: [user.user_id],
            skipNavigation: true
          })
        ]
      })
    )
    navigation.navigate('TipArtist')
    onClose()
  }, [onClose, currentUserId, dispatch, navigation, user, presetMessage])

  const handleFollowPress = useCallback(() => {
    if (userId) {
      const followSuccessActions: Action[] = [
        chatActions.createChat({
          userIds: [userId]
        })
      ]
      dispatch(
        followUser(
          userId,
          FollowSource.INBOX_UNAVAILABLE_MODAL,
          undefined,
          followSuccessActions
        )
      )
    }
    onClose()
  }, [userId, dispatch, onClose])

  switch (callToAction) {
    case ChatPermissionAction.FOLLOW:
      return (
        <>
          <Text style={styles.callToActionText}>
            {messages.followRequired(
              user ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={styles.callToActionText}>{user.name}</Text>
                  <UserBadges userId={user.user_id} badgeSize='xs' />
                </View>
              ) : null
            )}
          </Text>
          <Button
            key={messages.follow}
            onPress={handleFollowPress}
            variant='primary'
            fullWidth
          >
            {messages.follow}
          </Button>
        </>
      )
    case ChatPermissionAction.TIP:
      return (
        <>
          <Text style={styles.callToActionText}>
            {messages.tipGated(
              user ? (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                >
                  <Text style={styles.callToActionText}>{user.name}</Text>
                  <UserBadges userId={user.user_id} badgeSize='xs' />
                </View>
              ) : null
            )}
          </Text>
          <Button
            key={messages.sendAudio}
            onPress={handleTipPress}
            variant='primary'
            iconLeft={IconTipping}
            fullWidth
          >
            {messages.sendAudio}
          </Button>
        </>
      )
    case ChatPermissionAction.UNBLOCK:
      return (
        <>
          <Text style={styles.callToActionText}>{messages.blockee}</Text>
          <Button
            key={messages.unblockUser}
            onPress={handleUnblockPress}
            variant='primary'
            fullWidth
          >
            {messages.unblockUser}
          </Button>
          <Button
            key={messages.cancel}
            onPress={onClose}
            variant='secondary'
            fullWidth
          >
            {messages.cancel}
          </Button>
        </>
      )
    case ChatPermissionAction.NONE:
      return (
        <>
          <Text style={styles.callToActionText}>
            {messages.noAction}
            {user ? (
              <View
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Text style={styles.callToActionText}>{user.name}</Text>
                <UserBadges userId={user.user_id} badgeSize='xs' />
              </View>
            ) : null}
          </Text>
          <Button
            key={messages.learnMore}
            onPress={handleLearnMorePress}
            variant='secondary'
            fullWidth
          >
            {messages.learnMore}
          </Button>
        </>
      )
    default:
      return null
  }
}
export const InboxUnavailableDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const { isOpen, onClose, onClosed, data } = useInboxUnavailableModal()

  return (
    <Drawer isOpen={isOpen} onClose={onClose} onClosed={onClosed}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconMessageLocked fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <View style={styles.border} />
        <DrawerContent data={data} onClose={onClose} />
      </View>
    </Drawer>
  )
}
