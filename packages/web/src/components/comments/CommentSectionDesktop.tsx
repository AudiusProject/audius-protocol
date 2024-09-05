import { useEffect, useRef } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { Button, Divider, Flex, LoadingSpinner, Paper } from '@audius/harmony'
import InfiniteScroll from 'react-infinite-scroller'

import { useMainContentRef } from 'pages/MainContentContext'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import { CommentSkeletons } from './CommentSkeletons'
import { CommentSortBar } from './CommentSortBar'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

/**
 * This component is responsible for
 * - Render header & containers
 * - Mapping through the root comments array
 * - Infinite scrolling pagination
 */
export const CommentSectionDesktop = () => {
  const {
    currentUserId,
    comments,
    commentSectionLoading,
    isLoadingMorePages,
    reset,
    hasMorePages,
    loadMorePages
  } = useCurrentCommentSection()

  const mainContentRef = useMainContentRef()
  const commentPostAllowed = currentUserId !== null
  const commentSectionRef = useRef<HTMLDivElement | null>(null)

  // Need refs for these values because the scroll handler will not be able to access state changes
  const isLoadingMorePagesRef = useRef(isLoadingMorePages)
  const hasMorePagesRef = useRef(hasMorePages)
  useEffect(() => {
    // Keep the ref values up to date
    isLoadingMorePagesRef.current = isLoadingMorePages
    hasMorePagesRef.current = hasMorePages
  }, [isLoadingMorePages, hasMorePages])

  if (commentSectionLoading) {
    return <CommentSkeletons />
  }

  return (
    <Flex
      gap='l'
      direction='column'
      w='100%'
      alignItems='flex-start'
      ref={commentSectionRef}
    >
      <CommentHeader commentCount={comments.length} />
      <Button
        onClick={() => {
          reset(true)
        }}
      >
        Refresh{' '}
      </Button>
      <Paper w='100%' direction='column'>
        {commentPostAllowed !== null ? (
          <>
            <Flex gap='s' p='xl' w='100%' direction='column'>
              <CommentForm />
            </Flex>

            <Divider color='default' orientation='horizontal' />
          </>
        ) : null}
        <Flex ph='xl' pv='l' w='100%' direction='column' gap='l'>
          <CommentSortBar />
          <InfiniteScroll
            hasMore={hasMorePages}
            loadMore={loadMorePages}
            getScrollParent={() => mainContentRef.current ?? null}
            useWindow={false}
            threshold={-250}
          >
            <Flex direction='column' gap='xl' pt='m'>
              {comments.length === 0 ? <NoComments /> : null}
              {comments.map(({ id }) => (
                <CommentThread commentId={id} key={id} />
              ))}
              {isLoadingMorePages ? (
                <Flex justifyContent='center' mt='l'>
                  <LoadingSpinner css={{ width: 20, height: 20 }} />
                </Flex>
              ) : null}
            </Flex>
          </InfiniteScroll>
        </Flex>
      </Paper>
    </Flex>
  )
}
