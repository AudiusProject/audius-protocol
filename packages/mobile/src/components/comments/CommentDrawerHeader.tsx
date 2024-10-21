import React, { useCallback } from 'react'

import {
  useCurrentCommentSection,
  useGetTrackCommentNotificationSetting,
  useUpdateTrackCommentNotificationSetting
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import { Portal } from '@gorhom/portal'
import { useKeyboard } from '@react-native-community/hooks'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'
import { useToggle } from 'react-use'

import {
  Flex,
  IconButton,
  IconCloseAlt,
  IconKebabHorizontal,
  IconRefresh,
  PlainButton,
  Text
} from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'

import { ActionDrawerWithoutRedux } from '../action-drawer'

import { CommentSortBar } from './CommentSortBar'

type CommentDrawerHeaderProps = {
  minimal?: boolean
}

export const CommentDrawerHeader = (props: CommentDrawerHeaderProps) => {
  const { minimal = false } = props
  const { toast } = useToast()

  const {
    commentCount,
    currentUserId,
    artistId,
    entityId,
    reset,
    closeDrawer
  } = useCurrentCommentSection()
  const isOwner = currentUserId === artistId
  const isMuted = useGetTrackCommentNotificationSetting(entityId)

  const [muteTrackCommentNotifications] =
    useUpdateTrackCommentNotificationSetting(entityId)

  const [isNotificationActionDrawerOpen, toggleNotificationActionDrawer] =
    useToggle(false)

  const handleUpdateNotificationSetting = () => {
    muteTrackCommentNotifications(isMuted ? 'unmute' : 'mute')
    toast({
      content: isMuted
        ? messages.toasts.unmutedTrackNotifs
        : messages.toasts.mutedTrackNotifs
    })
  }

  const showCommentSortBar = commentCount > 1

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const { keyboardShown } = useKeyboard()

  return (
    <>
      <Flex p='l' gap='m'>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View>
            <View pointerEvents={keyboardShown ? 'none' : undefined}>
              <Flex
                direction='row'
                w='100%'
                justifyContent='space-between'
                alignItems='center'
              >
                <Flex direction='row' gap='m' alignItems='center'>
                  <Text variant='body' size={minimal ? 'l' : 'm'}>
                    {messages.title}
                    <Text color='subdued'>&nbsp;({commentCount})</Text>
                  </Text>

                  <PlainButton
                    iconLeft={IconRefresh}
                    variant='subdued'
                    onPress={() => reset(true)}
                  >
                    {messages.newComments}
                  </PlainButton>
                </Flex>
                <IconButton
                  icon={isOwner ? IconKebabHorizontal : IconCloseAlt}
                  onPress={
                    isOwner ? toggleNotificationActionDrawer : closeDrawer
                  }
                  color='subdued'
                  size='m'
                />
              </Flex>
              {showCommentSortBar && !minimal ? <CommentSortBar /> : null}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Flex>
      {isOwner ? (
        <Portal hostName='DrawerPortal'>
          <ActionDrawerWithoutRedux
            isOpen={isNotificationActionDrawerOpen}
            onClose={toggleNotificationActionDrawer}
            rows={[
              {
                text: isMuted
                  ? messages.popups.trackNotifications.unmute
                  : messages.popups.trackNotifications.mute,
                callback: handleUpdateNotificationSetting,
                style: { textAlign: 'center' }
              }
            ]}
          />
        </Portal>
      ) : null}
    </>
  )
}
