import React from 'react'

import { useGetTrackCommentNotificationSetting } from '@audius/common/api'
import {
  useCurrentCommentSection,
  useMuteTrackCommentNotifications
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'
import { Portal } from '@gorhom/portal'
import { useToggle } from 'react-use'

import {
  Flex,
  IconButton,
  IconCloseAlt,
  IconKebabHorizontal,
  Text
} from '@audius/harmony-native'
import { useToast } from 'app/hooks/useToast'

import { ActionDrawerWithoutRedux } from '../action-drawer'

import { CommentSortBar } from './CommentSortBar'

type CommentDrawerHeaderProps = {
  bottomSheetModalRef: React.RefObject<BottomSheetModal>
}

export const CommentDrawerHeader = (props: CommentDrawerHeaderProps) => {
  const { bottomSheetModalRef } = props
  const { toast } = useToast()

  const { commentCount, currentUserId, artistId, entityId } =
    useCurrentCommentSection()
  const isOwner = currentUserId === artistId
  const { data: isMuted } = useGetTrackCommentNotificationSetting({
    trackId: entityId,
    currentUserId
  })

  const [muteTrackCommentNotifications] =
    useMuteTrackCommentNotifications(entityId)

  const [isNotificationActionDrawerOpen, toggleNotificationActionDrawer] =
    useToggle(false)

  const handleUpdateNotificationSetting = () => {
    muteTrackCommentNotifications(isMuted ? 'unmute' : 'mute')
    toast({
      content: isMuted
        ? messages.popups.trackNotifications.unmutedToast
        : messages.popups.trackNotifications.mutedToast
    })
  }

  const handlePressClose = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  return (
    <>
      <Flex p='l' gap='m'>
        <Flex
          direction='row'
          w='100%'
          justifyContent='space-between'
          alignItems='center'
        >
          <Text variant='body' size='m'>
            {messages.title}
            <Text color='subdued'>&nbsp;({commentCount})</Text>
          </Text>
          <IconButton
            icon={isOwner ? IconKebabHorizontal : IconCloseAlt}
            onPress={
              isOwner ? toggleNotificationActionDrawer : handlePressClose
            }
            color='subdued'
            size='m'
          />
        </Flex>
        <CommentSortBar />
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
