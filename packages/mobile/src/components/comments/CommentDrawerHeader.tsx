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
  minimal?: boolean
}

export const CommentDrawerHeader = (props: CommentDrawerHeaderProps) => {
  const { bottomSheetModalRef, minimal = false } = props

  const { commentCount } = useCurrentCommentSection()
  const showCommentSortBar = commentCount > 1

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
        <Text variant='body' size={minimal ? 'l' : 'm'}>
          {messages.comments}
          <Text color='subdued'>&nbsp;({commentCount})</Text>
        </Text>
        <IconButton
          icon={IconCloseAlt}
          onPress={handlePressClose}
          color='subdued'
          size='m'
        />
      </Flex>
      {showCommentSortBar && !minimal ? <CommentSortBar /> : null}
    </Flex>
  )
}
