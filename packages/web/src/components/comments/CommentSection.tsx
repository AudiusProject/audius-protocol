import { useEffect, useState, useCallback } from 'react'

import { useComment } from '@audius/common/api'
import {
  CommentSectionProvider,
  useCurrentCommentSection
} from '@audius/common/context'
import { useFeatureFlag } from '@audius/common/hooks'
import { ID } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import { trackPageSelectors } from '@audius/common/store'
import { Divider, Flex, LoadingSpinner, Paper } from '@audius/harmony'
import { HashId } from '@audius/sdk'
import InfiniteScroll from 'react-infinite-scroller'
import { useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom-v5-compat'
import { tracksActions } from '~/store/pages/track/lineup/actions'

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

const { getLineup } = trackPageSelectors

type CommentSectionInnerProps = {
  commentSectionRef: React.RefObject<HTMLDivElement>
}

/**
 * This component is responsible for
 * - Rendering header & containers
 * - Mapping through the root comments array
 * - Infinite scrolling pagination
 */
const CommentSectionInner = (props: CommentSectionInnerProps) => {
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

  // Get the commentId query param from the url
  const commentIdParam = searchParams.get('commentId')
  const { data: highlightComment } = useComment(HashId.parse(commentIdParam))
  // TODO: Update this when highlighting replies is implemented
  const parentCommentId = highlightComment?.parentCommentId
    ? null
    : HashId.parse(commentIdParam)

  const [isFirstLoad, setIsFirstLoad] = useState(true)

  useEffect(() => {
    if (!commentSectionLoading && isFirstLoad) {
      setIsFirstLoad(false)
    }
  }, [commentSectionLoading, isFirstLoad])

  const handleScrollEnd = useCallback(() => {
    history.replace({ search: '' })
    // replacing history scrolls to top, so we need to scroll to the comment section
    commentSectionRef.current?.scrollIntoView()
    setHasScrolledIntoView(true)
    mainContentRef.current?.removeEventListener('scrollend', handleScrollEnd)
  }, [history, mainContentRef, commentSectionRef])

  useEffect(() => {
    if (
      showComments &&
      !hasScrolledIntoView &&
      !commentSectionLoading &&
      commentSectionRef.current
    ) {
      const mainContent = mainContentRef.current
      mainContent?.addEventListener('scrollend', handleScrollEnd)

      commentSectionRef.current.scrollIntoView({ behavior: 'smooth' })

      return () => {
        mainContent?.removeEventListener('scrollend', handleScrollEnd)
      }
    }
  }, [
    commentSectionLoading,
    showComments,
    hasScrolledIntoView,
    commentSectionRef,
    history,
    handleScrollEnd,
    mainContentRef
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
      <Paper
        w='100%'
        direction='column'
        css={{ overflow: 'visible' }}
        border='default'
      >
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
                  {parentCommentId ? (
                    <CommentThread commentId={parentCommentId} />
                  ) : null}
                  {commentIds
                    .filter((id) => id !== parentCommentId)
                    .map((id) => (
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
  const lineup = useSelector(getLineup)
  const uid = lineup?.entries?.[0]?.uid

  return (
    <CommentSectionProvider
      entityId={entityId}
      lineupActions={tracksActions}
      uid={uid}
    >
      <CommentSectionInner commentSectionRef={commentSectionRef} />
    </CommentSectionProvider>
  )
}
