import { PropsWithChildren, createContext, useContext, useState } from 'react'

import { ID } from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import { EntityType } from '@audius/sdk/src/sdk/services/EntityManager/types'
import { useAsync } from 'react-use'

import { audiusSdk } from 'services/audius-sdk'

import { MOCK_COMMENT_DATA } from './mock-data'
import { Comment } from './types'

/**
 * Context object to avoid prop drilling, make data access easy, and avoid Redux 😉
 */

// Props passed in from above
type CommentSectionContextProps = {
  userId: Nullable<ID>
  entityId: ID
  entityType?: EntityType
}

// Props sent down to context (some are handled inside the context component)
type CommentSectionContextType = CommentSectionContextProps & {
  isLoading: boolean
  comments: Comment[]
}

const initialContextValues: CommentSectionContextType = {
  userId: null,
  entityId: -1,
  entityType: EntityType.TRACK,
  isLoading: true,
  comments: []
}

export const CommentSectionContext =
  createContext<CommentSectionContextType>(initialContextValues)

export const CommentSectionProvider = ({
  userId,
  entityId,
  entityType = EntityType.TRACK,
  children
}: PropsWithChildren<CommentSectionContextProps>) => {
  const [comments, setComments] = useState(initialContextValues.comments)
  const [isLoading, setIsLoading] = useState(initialContextValues.isLoading)

  // TODO: assuming we move this to audius-query
  useAsync(async () => {
    if (entityId) {
      try {
        setIsLoading(true)
        const sdk = await audiusSdk()
        const commentsRes = await sdk.tracks.trackComments({
          trackId: String(entityId)
        })
        const commentsJson = await commentsRes
        console.log({ commentsJson }) // TODO: this response is no good atm, probably need to type backend for SDK to not assume VoidResponse
        setComments(MOCK_COMMENT_DATA)
        setIsLoading(false)
      } catch (e) {
        setComments(MOCK_COMMENT_DATA) // TODO: remove, was testing with staging
        setIsLoading(false)
        console.log('COMMENTS DEBUG: Error fetching comments', e)
      }
    }
  }, [entityId])

  return (
    <CommentSectionContext.Provider
      value={{ userId, entityId, entityType, comments, isLoading }}
    >
      {children}
    </CommentSectionContext.Provider>
  )
}

export const useCurrentCommentSection = () => {
  const context = useContext(CommentSectionContext)

  if (!context) {
    throw new Error(
      'useCurrentCommentSection must be used within a CommentSectionProvider'
    )
  }

  return context
}
