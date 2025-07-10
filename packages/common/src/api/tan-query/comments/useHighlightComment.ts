import { HashId } from '@audius/sdk'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useComment } from './useComment'

export const useHighlightComment = () => {
  const [searchParams] = useSearchParams()
  const commentIdParam = searchParams.get('commentId')

  const { data: highlightComment } = useComment(
    commentIdParam ? HashId.parse(commentIdParam) : 0
  )

  return highlightComment ?? null
}
