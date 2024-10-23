import { useEffect, useState } from 'react'

import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { Divider, Flex, LoadingSpinner, Paper } from '@audius/harmony'
import InfiniteScroll from 'react-infinite-scroller'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useHistoryContext } from 'app/HistoryProvider'
import { useMainContentRef } from 'pages/MainContentContext'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import {
  CommentBlockSkeletons,
  CommentFormSkeleton,
  SortBarSkeletons
} from './CommentSkeletons'
import { CommentSortBar } from './CommentSortBar'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

type CommentSectionInnerProps = {
  commentSectionRef: React.RefObject<HTMLDivElement>
}

/**
 * This component is responsible for
 * - Rendering header & containers
 * - Mapping through the root comments array
 * - Infinite scrolling pagination
 */
export const CommentSectionInner = (props: CommentSectionInnerProps) => {
  const { commentSectionRef } = props
  const {
    currentUserId,
    commentIds,
    commentSectionLoading,
    isLoadingMorePages,
    hasMorePages,
    loadMorePages
  } = useCurrentCommentSection()

  const mainContentRef = useMainContentRef()
  const { isEnabled: commentPostFlag = false } = useFeatureFlag(
    FeatureFlags.COMMENT_POSTING_ENABLED
  )
  const commentPostAllowed = currentUserId !== undefined && commentPostFlag
  const showCommentSortBar = commentIds.length > 1

  const [searchParams] = useSearchParams()
  const showComments = searchParams.get('showComments')
  const [hasScrolledIntoView, setHasScrolledIntoView] = useState(false)
  const { history } = useHistoryContext()

  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    if (!commentSectionLoading && isFirstLoad) {
      setIsFirstLoad(false)
    }
  }, [commentSectionLoading, isFirstLoad])

  // Scroll to the comment section if the showComments query param is present
  useEffect(() => {
    if (
      showComments &&
      !hasScrolledIntoView &&
      !commentSectionLoading &&
      commentSectionRef.current
    ) {
      history.replace({ search: '' })
      commentSectionRef.current.scrollIntoView({ behavior: 'smooth' })
      setHasScrolledIntoView(true)
    }
  }, [
    commentSectionLoading,
    showComments,
    hasScrolledIntoView,
    commentSectionRef,
    history
  ])

  return (
    <Flex
      gap='l'
      direction='column'
      w='100%'
      alignItems='flex-start'
      ref={commentSectionRef}
    >
      <CommentHeader />
      <Paper w='100%' direction='column'>
        {commentPostAllowed ? (
          <>
            <Flex gap='s' p='xl' w='100%' direction='column'>
              {commentSectionLoading && isFirstLoad ? (
                <CommentFormSkeleton />
              ) : (
                <CommentForm disabled={commentSectionLoading} />
              )}
            </Flex>

            <Divider color='default' orientation='horizontal' />
          </>
        ) : null}
        <Flex ph='xl' pv='l' w='100%' direction='column' gap='l'>
          {commentSectionLoading ? (
            <SortBarSkeletons />
          ) : showCommentSortBar ? (
            <CommentSortBar />
          ) : null}
          <InfiniteScroll
            hasMore={hasMorePages}
            loadMore={loadMorePages}
            getScrollParent={() => mainContentRef.current ?? null}
            useWindow={false}
            threshold={-250}
          >
            <Flex direction='column' gap='xl' pt='m'>
              {commentSectionLoading ? (
                <CommentBlockSkeletons />
              ) : (
                <>
                  {commentIds.length === 0 ? <NoComments /> : null}
                  {commentIds.map((id) => (
                    <CommentThread commentId={id} key={id} />
                  ))}
                  {isLoadingMorePages ? (
                    <Flex justifyContent='center' mt='l'>
                      <LoadingSpinner css={{ width: 20, height: 20 }} />
                    </Flex>
                  ) : null}
                </>
              )}
            </Flex>
          </InfiniteScroll>
        </Flex>
      </Paper>
    </Flex>
  )
}

type CommentSectionProps = {
  entityId: ID
  commentSectionRef: React.RefObject<HTMLDivElement>
}

export const CommentSection = (props: CommentSectionProps) => {
  const { entityId, commentSectionRef } = props

  return (
    <CommentSectionProvider entityId={entityId}>
      <CommentSectionInner commentSectionRef={commentSectionRef} />
    </CommentSectionProvider>
  )
}
