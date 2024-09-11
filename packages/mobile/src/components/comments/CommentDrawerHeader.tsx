import React from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import type { BottomSheetModal } from '@gorhom/bottom-sheet'

import { Flex, IconButton, IconCloseAlt, Text } from '@audius/harmony-native'

import { CommentSortBar } from './CommentSortBar'

const messages = {
  comments: 'Comments'
}

type CommentDrawerHeaderProps = {
  bottomSheetModalRef: React.RefObject<BottomSheetModal>
}

export const CommentDrawerHeader = (props: CommentDrawerHeaderProps) => {
  const { bottomSheetModalRef } = props

  const { comments, commentSectionLoading: isLoading } =
    useCurrentCommentSection()

  const handlePressClose = () => {
    bottomSheetModalRef.current?.dismiss()
  }

  return (
    <Flex p='l' gap='m'>
      <Flex
        direction='row'
        w='100%'
        justifyContent='space-between'
        alignItems='center'
      >
        <Text variant='body' size='m'>
          {messages.comments}
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
      <CommentSortBar />
    </Flex>
  )
}
