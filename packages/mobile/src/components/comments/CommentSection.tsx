import { useCallback } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { commentsMessages as messages } from '@audius/common/messages'
import type { ID } from '@audius/common/models'
import { TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import { useEffectOnce } from 'react-use'

import {
  Flex,
  IconCaretRight,
  Paper,
  PlainButton,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { useRoute } from 'app/hooks/useRoute'

import Skeleton from '../skeleton'

import { CommentBlock } from './CommentBlock'
import { useCommentDrawer } from './CommentDrawerContext'
import { CommentForm } from './CommentForm'

type CommentSectionHeaderProps = {
  openCommentDrawer: () => void
}

const CommentSectionHeader = (props: CommentSectionHeaderProps) => {
  const { openCommentDrawer } = props
  const {
    commentSectionLoading: isLoading,
    commentIds,
    commentCount
  } = useCurrentCommentSection()
  const handlePressViewAll = () => {
    openCommentDrawer()
  }

  const isShowingComments = !isLoading && commentIds?.length

  return (
    <Flex
      direction='row'
      w='100%'
      justifyContent='space-between'
      alignItems='center'
    >
      <Text variant='title' size='m'>
        Comments
        {isShowingComments ? (
          <Text color='subdued'>&nbsp;({commentCount})</Text>
        ) : null}
      </Text>
      {isShowingComments ? (
        <PlainButton
          onPress={handlePressViewAll}
          iconRight={IconCaretRight}
          variant='subdued'
        >
          {messages.viewAll}
        </PlainButton>
      ) : null}
    </Flex>
  )
}

type CommentSectionContentProps = {
  openCommentDrawer: (autoFocus?: boolean) => void
}

const CommentSectionContent = (props: CommentSectionContentProps) => {
  const { openCommentDrawer } = props
  const {
    commentSectionLoading: isLoading,
    commentIds,
    isEntityOwner
  } = useCurrentCommentSection()

  const handlePress = useCallback(() => {
    openCommentDrawer()
  }, [openCommentDrawer])

  const handleFormPress = useCallback(() => {
    openCommentDrawer(true)
  }, [openCommentDrawer])

  // Loading state
  if (isLoading) {
    return (
      <Flex direction='row' gap='s' alignItems='center'>
        <Skeleton width={40} height={40} style={{ borderRadius: 100 }} />
        <Flex gap='s'>
          <Skeleton height={20} width={240} />
          <Skeleton height={20} width={160} />
        </Flex>
      </Flex>
    )
  }

  // Empty state
  if (!commentIds || !commentIds.length) {
    return (
      <Flex gap='m'>
        <Text variant='body'>
          {isEntityOwner ? messages.noCommentsOwner : messages.noComments}
        </Text>
        <TouchableWithoutFeedback onPress={handleFormPress}>
          <View>
            <View pointerEvents='none'>
              <CommentForm />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Flex>
    )
  }

  return (
    <TouchableOpacity onPress={handlePress}>
      <CommentBlock commentId={commentIds[0]} hideActions />
    </TouchableOpacity>
  )
}

type CommentSectionProps = {
  entityId: ID
}

export const CommentSection = (props: CommentSectionProps) => {
  const { entityId } = props

  const { params } = useRoute<'Track'>()
  const { showComments } = params ?? {}

  const navigation = useNavigation()
  const { open } = useCommentDrawer()

  const openCommentDrawer = useCallback(
    (autoFocusInput?: boolean) => {
      open({ entityId, navigation, autoFocusInput })
    },
    [open, entityId, navigation]
  )

  useEffectOnce(() => {
    if (showComments) {
      openCommentDrawer()
    }
  })

  return (
    <CommentSectionProvider entityId={entityId}>
      <Flex gap='s' direction='column' w='100%' alignItems='flex-start'>
        <CommentSectionHeader openCommentDrawer={openCommentDrawer} />
        <Paper w='100%' direction='column' gap='s' p='l'>
          <CommentSectionContent openCommentDrawer={openCommentDrawer} />
        </Paper>
      </Flex>
    </CommentSectionProvider>
  )
}
