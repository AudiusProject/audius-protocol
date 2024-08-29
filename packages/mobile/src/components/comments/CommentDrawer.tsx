import React, { useCallback, useEffect, useRef } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import {
  BottomSheetFlatList,
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box, Divider, Flex } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import Skeleton from '../skeleton'

import { CommentDrawerForm } from './CommentDrawerForm'
import { CommentDrawerHeader } from './CommentDrawerHeader'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

const CommentDrawerContent = () => {
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
            <CommentSectionProvider entityId={entityId}>
              <CommentDrawerForm />
            </CommentSectionProvider>
          </BottomSheetFooter>
        )}
        onDismiss={handleClose}
      >
        <CommentSectionProvider entityId={entityId}>
          <CommentDrawerHeader bottomSheetModalRef={bottomSheetModalRef} />

          <Divider orientation='horizontal' />
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
