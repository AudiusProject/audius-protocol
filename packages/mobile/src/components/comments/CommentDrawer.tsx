import React, { useCallback, useEffect, useRef } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { accountSelectors } from '@audius/common/store'
import {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import { Box, Divider, Flex, useTheme } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'

import Skeleton from '../skeleton'

import { CommentDrawerForm } from './CommentDrawerForm'
import { CommentDrawerHeader } from './CommentDrawerHeader'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

const { getUserId } = accountSelectors

type CommentDrawerContentProps = {}

const CommentDrawerContent = (props: CommentDrawerContentProps) => {
  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  // Loading state
  if (isLoading) {
    return (
      <Flex direction='row' gap='s' alignItems='center' p='l'>
        <Skeleton width={40} height={40} style={{ borderRadius: 100 }} />
        <Flex gap='s'>
          <Skeleton height={20} width={240} />
          <Skeleton height={20} width={160} />
        </Flex>
      </Flex>
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
      data={comments}
      keyExtractor={({ id }) => id}
      ListHeaderComponent={<Box h='l' />}
      enableFooterMarginAdjustment
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
  const currentUserId = useSelector(getUserId)

  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const {
    data: { entityId, isEntityOwner, artistId },
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
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            pressBehavior='close'
          />
        )}
        footerComponent={(props) => (
          <BottomSheetFooter {...props} bottomInset={insets.bottom}>
            <CommentSectionProvider
              currentUserId={currentUserId}
              artistId={artistId}
              entityId={entityId}
              isEntityOwner={isEntityOwner}
              playTrack={() => {}} // TODO
            >
              <CommentDrawerForm />
            </CommentSectionProvider>
          </BottomSheetFooter>
        )}
        onDismiss={handleClose}
      >
        <CommentSectionProvider
          currentUserId={currentUserId}
          artistId={artistId}
          entityId={entityId}
          isEntityOwner={isEntityOwner}
          playTrack={() => {}} // TODO
        >
          <CommentDrawerHeader bottomSheetModalRef={bottomSheetModalRef} />

          <Divider orientation='horizontal' />
          <CommentDrawerContent />
        </CommentSectionProvider>
      </BottomSheetModal>
      {/* <Box
        style={{
          backgroundColor: color.background.white,
          position: 'absolute',
          bottom: 0,
          width: '100%',
          zIndex: 5,
          height: insets.bottom
        }}
      /> */}
    </>
  )
}
