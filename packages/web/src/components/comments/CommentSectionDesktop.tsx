import { useEffect, useRef } from 'react'

import { useCurrentCommentSection } from '@audius/common/context'
import { Button, Divider, Flex, LoadingSpinner, Paper } from '@audius/harmony'
import { debounce } from 'lodash'
import { useEffectOnce } from 'react-use'

import { CommentForm } from './CommentForm'
import { CommentHeader } from './CommentHeader'
import { CommentSkeletons } from './CommentSkeletons'
import { CommentSortBar } from './CommentSortBar'
import { CommentThread } from './CommentThread'
import { NoComments } from './NoComments'

export const CommentSectionDesktop = () => {
  const {
    currentUserId,
    comments,
    commentSectionLoading,
    isLoadingMorePages,
    reset,
    hasMorePages,
    handleLoadMoreRootComments
  } = useCurrentCommentSection()

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

  // Endless scroll pagination logic
  useEffectOnce(() => {
    const handleScroll = (e: Event) => {
      if (
        !isLoadingMorePagesRef.current &&
        hasMorePagesRef.current &&
        commentSectionRef.current
      ) {
        const scrollTopPosition = (e.target as HTMLElement)?.scrollTop ?? 0 // How far along the window has scrolled
        const containerOffsetHeight = commentSectionRef.current.offsetHeight // How tall our container is
        // Start loading more at 75% of the way scrolled to the bottom
        const shouldLoadMore = scrollTopPosition >= containerOffsetHeight * 0.75
        if (shouldLoadMore) {
          handleLoadMoreRootComments()
        }
      }
    }
    const listenerFn = debounce(handleScroll, 50) // small debounce to avoid a race condition between scroll handler and state updates to isLoadingMorePages/hasMorePages
    window.addEventListener('scroll', listenerFn, true) // Note: 3rd true argument is to make sure we capture the event at the window level (otherwise it gets captured elsewhere)
    return () => window.removeEventListener('scroll', listenerFn)
  })

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
          <Flex direction='column' gap='xl' pt='m'>
            {comments.length === 0 ? <NoComments /> : null}
            {comments.map(({ id }) => (
              <CommentThread commentId={id} key={id} />
            ))}
            {isLoadingMorePages ? (
              <LoadingSpinner
                css={{ width: 20, height: 20, alignSelf: 'center' }}
              />
            ) : null}
          </Flex>
        </Flex>
      </Paper>
    </Flex>
  )
}
