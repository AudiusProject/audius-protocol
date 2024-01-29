import { useCallback } from 'react'

import { cacheUsersSelectors, chatActions, chatSelectors } from '@audius/common'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconBlockMessages } from '@audius/harmony-native'
import { IconInfo } from '@audius/harmony-native'
import { Text, Button } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'
import { track, make } from 'app/services/analytics'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles, flexRowCentered } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { EventNames } from 'app/types/analytics'
import { useColor } from 'app/utils/theme'

const { getUser } = cacheUsersSelectors
const { getDoesBlockUser, getCanCreateChat } = chatSelectors
const { blockUser, unblockUser, createChat } = chatActions

const BLOCK_MESSAGES_MODAL_NAME = 'BlockMessages'

const messages = {
  title: 'Are you sure?',
  confirmBlock: (userName?: string, isReportAbuse?: boolean) => (
    <>
      {'Are you sure you want to '}
      {isReportAbuse ? 'report ' : 'block '}
      {userName}
      {isReportAbuse
        ? ' for abuse? They will be blocked from sending you new messages.'
        : ' from sending messages to your inbox?'}
    </>
  ),
  confirmUnblock: (userName?: string) => (
    <>
      {'Are you sure you want to unblock '}
      {userName}
      {' and allow them to send messages to your inbox?'}
    </>
  ),
  info: 'This will not affect their ability to view your profile or interact with your content.',
  blockUser: 'Block User',
  unblockUser: 'Unblock User',
  reportUser: 'Report & Block',
  cancel: 'Cancel'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  drawer: {
    marginVertical: spacing(6.5),
    padding: spacing(3.5),
    gap: spacing(4)
  },
  titleContainer: {
    ...flexRowCentered(),
    gap: spacing(3.5),
    marginBottom: spacing(2),
    alignSelf: 'center'
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontByWeight.heavy,
    color: palette.neutralLight2,
    textTransform: 'uppercase',
    lineHeight: typography.fontSize.xl * 1.25
  },
  confirm: {
    fontSize: typography.fontSize.large,
    lineHeight: typography.fontSize.large * 1.5,
    color: palette.neutral
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
  infoText: {
    fontSize: typography.fontSize.medium,
    lineHeight: typography.fontSize.medium * 1.375,
    marginRight: spacing(12)
  },
  infoIcon: {
    width: spacing(5),
    height: spacing(5),
    color: palette.neutral
  },
  button: {
    padding: spacing(4),
    height: spacing(12)
  },
  blockButton: {
    borderColor: palette.accentRed
  },
  blockText: {
    fontSize: typography.fontSize.large
  }
}))

export const BlockMessagesDrawer = () => {
  const styles = useStyles()
  const neutralLight2 = useColor('neutralLight2')
  const neutral = useColor('neutral')
  const dispatch = useDispatch()
  const { data } = useDrawer('BlockMessages')
  const { userId, shouldOpenChat, isReportAbuse } = data
  const user = useSelector((state) => getUser(state, { id: userId }))
  // Assuming blockees have already been fetched in ProfileActionsDrawer.
  const doesBlockUser = useSelector((state) => getDoesBlockUser(state, userId))
  const { canCreateChat } = useSelector((state) =>
    getCanCreateChat(state, { userId })
  )

  const handleConfirmPress = useCallback(() => {
    if (doesBlockUser) {
      dispatch(unblockUser({ userId }))
      if (shouldOpenChat && canCreateChat) {
        dispatch(createChat({ userIds: [userId] }))
      }
    } else {
      dispatch(blockUser({ userId }))
      if (isReportAbuse) {
        track(
          make({
            eventName: EventNames.CHAT_REPORT_USER,
            reportedUserId: userId
          })
        )
      }
    }
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: false
      })
    )
  }, [
    canCreateChat,
    dispatch,
    doesBlockUser,
    isReportAbuse,
    shouldOpenChat,
    userId
  ])

  const handleCancelPress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'BlockMessages',
        visible: false
      })
    )
  }, [dispatch])

  return (
    <NativeDrawer drawerName={BLOCK_MESSAGES_MODAL_NAME}>
      <View style={styles.drawer}>
        <View style={styles.titleContainer}>
          <IconBlockMessages fill={neutralLight2} />
          <Text style={styles.title}>{messages.title}</Text>
        </View>
        <Text style={styles.confirm}>
          {doesBlockUser
            ? messages.confirmUnblock(user?.name)
            : messages.confirmBlock(user?.name, isReportAbuse)}
        </Text>
        {doesBlockUser ? null : (
          <View style={styles.infoContainer}>
            <IconInfo
              style={styles.infoIcon}
              fill={neutral}
              height={spacing(5)}
              width={spacing(5)}
            />
            <Text style={styles.infoText}>{messages.info}</Text>
          </View>
        )}
        <Button
          title={
            isReportAbuse
              ? messages.reportUser
              : doesBlockUser
              ? messages.unblockUser
              : messages.blockUser
          }
          onPress={handleConfirmPress}
          variant={doesBlockUser ? 'primary' : 'destructive'}
          styles={{
            root: styles.button,
            text: styles.blockText
          }}
          fullWidth
        />
        <Button
          title={messages.cancel}
          onPress={handleCancelPress}
          variant={doesBlockUser ? 'common' : 'primary'}
          styles={{
            root: styles.button,
            text: styles.blockText
          }}
          fullWidth
        />
      </View>
    </NativeDrawer>
  )
}
