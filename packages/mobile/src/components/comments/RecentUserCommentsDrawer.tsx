import { useCallback, useEffect, useRef } from 'react'

import { useUserComments } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { useRecentUserCommentsModal } from '@audius/common/store'
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box, useTheme, Text, Flex, Divider } from '@audius/harmony-native'
import { LoadingSpinner } from 'app/harmony-native/components/LoadingSpinner/LoadingSpinner'

import { CommentSkeleton } from './CommentSkeleton'
import { NoComments } from './NoComments'
import { COMMENT_DRAWER_BORDER_RADIUS } from './constants'
import { useGestureEventsHandlers } from './useGestureEventHandlers'
import { useScrollEventsHandlers } from './useScrollEventHandlers'

const messages = {
  title: 'Recent Comments'
}

const PAGE_SIZE = 10

// const useStyles = makeStyles(({ spacing, typography, palette }) => ({}))

const RecentUserCommentsDrawerContent = ({ userId }: { userId: ID }) => {
  // const {
  //   commentIds,
  //   commentSectionLoading: isLoading,
  //   loadMorePages,
  //   isLoadingMorePages
  // } = useCurrentCommentSection()
  const {
    data: commentIds,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage
  } = useUserComments(userId)
  console.log('commentIds', commentIds)

  const handleEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage])

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
  if (!commentIds || !commentIds.length) {
    return (
      <Flex p='l'>
        <NoComments />
      </Flex>
    )
  }

  return (
    <BottomSheetFlatList
      // ref={commentListRef}
      data={commentIds}
      keyExtractor={(id) => id.toString()}
      ListHeaderComponent={<Box h='l' />}
      ListFooterComponent={
        <>
          {isFetchingNextPage ? (
            <Flex row justifyContent='center' mb='xl' w='100%'>
              <LoadingSpinner style={{ width: 20, height: 20 }} />
            </Flex>
          ) : null}

          <Box h='l' />
        </>
      }
      enableFooterMarginAdjustment
      scrollEventsHandlersHook={useScrollEventsHandlers}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.3}
      renderItem={({ item: id }) => (
        <Box ph='l'>
          <Text>{`Comment ${id}`}</Text>
        </Box>
      )}
    />
  )
}

export const RecentUserCommentsDrawer = () => {
  const { color } = useTheme()
  const insets = useSafeAreaInsets()

  // const styles = useStyles()
  const {
    data: { userId },
    isOpen,
    onClose
  } = useRecentUserCommentsModal()

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (isOpen) {
      bottomSheetModalRef.current?.present()
    } else {
      bottomSheetModalRef.current?.dismiss()
    }
  }, [isOpen])

  if (!userId) {
    console.error('Cannot render RecentUserCommentsDrawer without a userId')
    return null
  }

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      snapPoints={['66%', '100%']}
      topInset={insets.top}
      style={{
        borderTopRightRadius: COMMENT_DRAWER_BORDER_RADIUS,
        borderTopLeftRadius: COMMENT_DRAWER_BORDER_RADIUS,
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
      onDismiss={onClose}
    >
      <Flex ph='l' pb='m'>
        <Text variant='title' size='m' strength='weak'>
          {messages.title}
        </Text>
      </Flex>
      <Divider orientation='horizontal' />
      <RecentUserCommentsDrawerContent userId={userId} />
    </BottomSheetModal>
    // TODO-NOW: Need bottom spacer?
  )
}
