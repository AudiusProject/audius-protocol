import type { RefObject } from 'react'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import type { Comment, ReplyComment } from '@audius/common/models'
import type {
  BottomSheetFlatListMethods,
  BottomSheetFooterProps
} from '@gorhom/bottom-sheet'
import {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box, Divider, Flex, useTheme } from '@audius/harmony-native'
import { LoadingSpinner } from 'app/harmony-native/components/LoadingSpinner/LoadingSpinner'
import { useDrawer } from 'app/hooks/useDrawer'

import { CommentDrawerForm } from './CommentDrawerForm'
import { CommentDrawerHeader } from './CommentDrawerHeader'
import { CommentSkeleton } from './CommentSkeleton'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'
import { useGestureEventsHandlers } from './useGestureEventHandlers'
import { useScrollEventsHandlers } from './useScrollEventHandlers'

const CommentDrawerContent = (props: {
  commentListRef: RefObject<BottomSheetFlatListMethods>
}) => {
  const { commentListRef } = props
  const {
    comments,
    commentSectionLoading: isLoading,
    loadMorePages,
    isLoadingMorePages
  } = useCurrentCommentSection()

  // Loading state
  if (isLoading) {
    return (
      <>
        <CommentSkeleton />
        <CommentSkeleton />
        <CommentSkeleton />
      </>
    )
  }

  // Empty state
  if (!comments || !comments.length) {
    return (
      <Flex p='l'>
        <NoComments />
      </Flex>
    )
  }

  return (
    <BottomSheetFlatList
      ref={commentListRef}
      data={comments}
      keyExtractor={({ id }) => id.toString()}
      ListHeaderComponent={<Box h='l' />}
      ListFooterComponent={
        <>
          {isLoadingMorePages ? (
            <Flex row justifyContent='center' mb='xl' w='100%'>
              <LoadingSpinner style={{ width: 20, height: 20 }} />
            </Flex>
          ) : null}

          <Box h='l' />
        </>
      }
      enableFooterMarginAdjustment
      scrollEventsHandlersHook={useScrollEventsHandlers}
      keyboardShouldPersistTaps='handled'
      onEndReached={loadMorePages}
      onEndReachedThreshold={0.3}
      renderItem={({ item }) => (
        <Box ph='l'>
          <CommentThread commentId={item.id} />
        </Box>
      )}
    />
  )
}

const BORDER_RADIUS = 40

export const CommentDrawer = () => {
  const { color } = useTheme()
  const insets = useSafeAreaInsets()
  const commentListRef = useRef<BottomSheetFlatListMethods>(null)

  const [replyingToComment, setReplyingToComment] = useState<
    Comment | ReplyComment
  >()
  const [editingComment, setEditingComment] = useState<Comment | ReplyComment>()

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const {
    data: { entityId },
    isOpen,
    onClosed
  } = useDrawer('Comment')

  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present()
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    onClosed()
  }, [onClosed])

  const renderFooterComponent = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <CommentSectionProvider
          entityId={entityId}
          replyingToComment={replyingToComment}
          setReplyingToComment={setReplyingToComment}
          editingComment={editingComment}
          setEditingComment={setEditingComment}
        >
          <CommentDrawerForm commentListRef={commentListRef} />
        </CommentSectionProvider>
      </BottomSheetFooter>
    ),
    [editingComment, entityId, insets.bottom, replyingToComment]
  )

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['66%', '100%']}
        topInset={insets.top}
        style={{
          borderTopRightRadius: BORDER_RADIUS,
          borderTopLeftRadius: BORDER_RADIUS,
          overflow: 'hidden'
        }}
        backgroundStyle={{ backgroundColor: color.background.white }}
        handleIndicatorStyle={{ backgroundColor: color.neutral.n200 }}
        gestureEventsHandlersHook={useGestureEventsHandlers}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior='close'
          />
        )}
        footerComponent={renderFooterComponent}
        onDismiss={handleClose}
      >
        <CommentSectionProvider
          entityId={entityId}
          replyingToComment={replyingToComment}
          setReplyingToComment={setReplyingToComment}
          editingComment={editingComment}
          setEditingComment={setEditingComment}
        >
          <CommentDrawerHeader bottomSheetModalRef={bottomSheetModalRef} />
          <Divider orientation='horizontal' />
          <CommentDrawerContent commentListRef={commentListRef} />
        </CommentSectionProvider>
      </BottomSheetModal>
      <Box
        style={{
          backgroundColor: color.background.white,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          zIndex: 5,
          height: insets.bottom
        }}
      />
    </>
  )
}
