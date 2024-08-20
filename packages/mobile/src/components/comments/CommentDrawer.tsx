import React, { useCallback, useEffect, useRef } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection,
  usePostComment
} from '@audius/common/context'
import { Status } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetTextInput,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import {
  Box,
  Divider,
  Flex,
  IconButton,
  IconCloseAlt,
  Text
} from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import Skeleton from '../skeleton'

import { CommentForm } from './CommentForm'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

const { getUserId } = accountSelectors

type CommentDrawerHeaderProps = {
  bottomSheetModalRef: React.RefObject<BottomSheetModal>
}

const CommentDrawerHeader = (props: CommentDrawerHeaderProps) => {
  const { bottomSheetModalRef } = props

  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  const handlePressClose = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  return (
    <Flex>
      <Flex
        direction='row'
        w='100%'
        justifyContent='space-between'
        p='l'
        alignItems='center'
      >
        <Text variant='body' size='m'>
          Comments
          {!isLoading && comments?.length ? (
            <Text color='subdued'>&nbsp;({comments.length})</Text>
          ) : null}
        </Text>
        <IconButton
          icon={IconCloseAlt}
          onPress={handlePressClose}
          color='subdued'
          size='m'
        />
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
      enableFooterMarginAdjustment
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
  const styles = useFormStyles()
  const [postComment, { status: postCommentStatus }] = usePostComment()

  const handlePostComment = (message: string) => {
    postComment(message, undefined)
  }

  return (
    <Box
      style={{
        ...styles.form
      }}
    >
      <Box p='l'>
        <CommentForm
          onSubmit={handlePostComment}
          isLoading={postCommentStatus === Status.LOADING}
          TextInputComponent={BottomSheetTextInput as any}
        />
      </Box>
    </Box>
  )
}

const BORDER_RADIUS = 40

const useStyles = makeStyles(({ palette }) => ({
  drawer: {
    backgroundColor: palette.white,
    width: '100%',
    shadowRadius: 15,
    borderTopRightRadius: BORDER_RADIUS,
    borderTopLeftRadius: BORDER_RADIUS,
    overflow: 'hidden'
  },
  chin: {
    backgroundColor: palette.white,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 5
  }
}))

export const CommentDrawer = () => {
  const styles = useStyles()
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
          <CommentDrawerContent />
        </CommentSectionProvider>
      </BottomSheetModal>
      <Box
        style={{
          ...styles.chin,
          height: insets.bottom
        }}
      />
    </>
  )
}
