import type { ReactNode } from 'react'
import { useCallback } from 'react'

import {
  chatSelectors,
  chatActions,
  tippingActions,
  cacheUsersSelectors,
  ChatPermissionAction
} from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconMessageLocked from 'app/assets/images/iconMessageLocked.svg'
import IconTip from 'app/assets/images/iconTip.svg'
import { Text, Button } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { useNavigation } from 'app/hooks/useNavigation'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles, flexRowCentered } from 'app/styles'
import { useColor } from 'app/utils/theme'

import { UserBadges } from '../user-badges'

const { unblockUser, createChat } = chatActions
const { getCanCreateChat } = chatSelectors
const { getUser } = cacheUsersSelectors
const { beginTip } = tippingActions

const INBOX_UNAVAILABLE_MODAL_NAME = 'InboxUnavailable'

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
  noAction: "You can't send messages to ",
  info: 'This will not affect their ability to view your profile or interact with your content.',
  unblockUser: 'Unblock User',
  learnMore: 'Learn More',
  sendAudio: 'Send $AUDIO',
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
  button: {
    padding: spacing(4),
    height: spacing(12)
  },
  buttonText: {
    color: palette.neutral,
    fontSize: typography.fontSize.large,
    fontFamily: typography.fontByWeight.bold
  },
  buttonTextWhite: {
    color: palette.white
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: palette.neutralLight8
  }
}))

const DrawerContent = () => {
  const styles = useStyles()
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const { data } = useDrawer('InboxUnavailable')
  const { userId, shouldOpenChat } = data
  const user = useSelector((state) => getUser(state, { id: userId }))
  const { canCreateChat, callToAction } = useSelector((state) =>
    getCanCreateChat(state, { userId })
  )

  const closeDrawer = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'InboxUnavailable',
        visible: false
      })
    )
  }, [dispatch])

  const handleUnblockPress = useCallback(() => {
    dispatch(unblockUser({ userId }))
    if (shouldOpenChat && canCreateChat) {
      dispatch(createChat({ userIds: [userId] }))
    }
    closeDrawer()
  }, [dispatch, userId, shouldOpenChat, canCreateChat, closeDrawer])

  const handleLearnMorePress = useCallback(() => {
    // TODO: Link to blog
    closeDrawer()
  }, [closeDrawer])

  const handleTipPress = useCallback(() => {
    dispatch(beginTip({ user, source: 'profile' }))
    navigation.navigate('TipArtist')
    closeDrawer()
  }, [closeDrawer, dispatch, navigation, user])

  switch (callToAction) {
    case ChatPermissionAction.NONE:
      return (
        <>
          <Text style={styles.callToActionText}>
            {messages.noAction}
            {user ? (
              <UserBadges
                user={user}
                nameStyle={styles.callToActionText}
                as={Text}
              />
            ) : null}
          </Text>
          <Button
            key={messages.learnMore}
            title={messages.learnMore}
            onPress={handleLearnMorePress}
            variant={'common'}
            styles={{
              root: styles.button,
              text: styles.buttonText
            }}
            fullWidth
          />
        </>
      )
    case ChatPermissionAction.TIP:
      return (
        <>
          <Text style={styles.callToActionText}>
            {messages.tipGated(
              user ? (
                <UserBadges
                  user={user}
                  nameStyle={styles.callToActionText}
                  as={Text}
                />
              ) : null
            )}
          </Text>
          <Button
            key={messages.sendAudio}
            title={messages.sendAudio}
            onPress={handleTipPress}
            variant={'primary'}
            icon={IconTip}
            iconPosition='left'
            styles={{
              root: styles.button,
              text: [styles.buttonText, styles.buttonTextWhite]
            }}
            fullWidth
          />
        </>
      )
    case ChatPermissionAction.UNBLOCK:
      return (
        <>
          <Text style={styles.callToActionText}>{messages.blockee}</Text>
          <Button
            key={messages.unblockUser}
            title={messages.unblockUser}
            onPress={handleUnblockPress}
            variant={'primary'}
            styles={{
              root: styles.button,
              text: [styles.buttonText, styles.buttonTextWhite]
            }}
            fullWidth
          />
          <Button
            key={messages.cancel}
            title={messages.cancel}
            onPress={closeDrawer}
            variant={'common'}
            styles={{
              root: styles.button,
              text: styles.buttonText
            }}
            fullWidth
          />
        </>
      )
    default:
      return null
  }
}

export const InboxUnavailableDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')

  return (
    <NativeDrawer drawerName={INBOX_UNAVAILABLE_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconMessageLocked fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <View style={styles.border} />
        <DrawerContent />
      </View>
    </NativeDrawer>
  )
}
