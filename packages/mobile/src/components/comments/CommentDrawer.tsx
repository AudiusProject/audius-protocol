import React, { useCallback, useEffect, useRef } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { Status } from '@audius/common/models'
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box, Divider, Flex, Text } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import Skeleton from '../skeleton'

import { CommentForm } from './CommentForm'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

const CommentDrawerHeader = () => {
  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  return (
    <Flex>
      <Flex direction='row' w='100%' justifyContent='space-between' p='l'>
        <Text variant='body' size='m'>
          Comments
          {!isLoading && comments?.length ? (
            <Text color='subdued'>&nbsp;({comments.length})</Text>
          ) : null}
        </Text>
      </Flex>
      <Divider orientation='horizontal' />
    </Flex>
  )
}

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
      renderItem={({ item }) => (
        <Box ph='l'>
          <CommentThread commentId={item.id} />
        </Box>
      )}
    />
  )
}

const useFormStyles = makeStyles(({ palette }) => ({
  form: {
    backgroundColor: palette.white
  }
}))

const CommentDrawerForm = () => {
  const insets = useSafeAreaInsets()
  const styles = useFormStyles()
  const { usePostComment } = useCurrentCommentSection()

  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

  // TODO: This needs to use BottomSheetTextInput so keyboard is handled
  return (
    <Box
      style={{
        ...styles.form,
        paddingBottom: insets.bottom
      }}
    >
      <Box p='l'>
        <CommentForm
          onSubmit={handlePostComment}
          isLoading={postCommentStatus === Status.LOADING}
        />
      </Box>
    </Box>
  )
}

const BORDER_RADIUS = 40

const useStyles = makeStyles(({ palette }) => ({
  drawer: {
    backgroundColor: palette.white,
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    shadowRadius: 15,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopLeftRadius: BORDER_RADIUS,
    overflow: 'hidden'
  }
}))

export const CommentDrawer = () => {
  const styles = useStyles()
  const insets = useSafeAreaInsets()
  const bottomSheetModalRef = useRef<BottomSheetModal>(null)
  const {
    data: { userId, entityId, isEntityOwner },
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
    <BottomSheetModal
      snapPoints={['66%', '100%']}
      topInset={insets.top}
      style={styles.drawer}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior='close'
        />
      )}
      footerComponent={(props) => (
        <BottomSheetFooter {...props}>
          <CommentSectionProvider
            userId={userId}
            entityId={entityId}
            isEntityOwner={isEntityOwner}
          >
            <CommentDrawerForm />
          </CommentSectionProvider>
        </BottomSheetFooter>
      )}
      ref={bottomSheetModalRef}
      onDismiss={handleClose}
    >
      <CommentSectionProvider
        userId={userId}
        entityId={entityId}
        isEntityOwner={isEntityOwner}
      >
        <CommentDrawerHeader />
        <CommentDrawerContent />
      </CommentSectionProvider>
    </BottomSheetModal>
  )
}
