import { useEffect } from 'react'

import { useDispatch } from 'react-redux'

import { ID } from '~/models/Identifiers'
import {
  collectionPageActions,
  collectionPageLineupActions,
  CollectionsPageType
} from '~/store/pages'

import { QueryOptions } from './types'
import { useCollection } from './useCollection'
import { useCollectionByPermalink } from './useCollectionByPermalink'

type CollectionParams =
  | { collectionId?: ID }
  | { handle?: string; slug?: string; collectionType?: CollectionsPageType }
  | { permalink?: string }

// feature-tan-query TODO: smart collections

/**
 * Hook that returns collection data given either a collection ID, handle+slug+type, or permalink.
 * Internally uses useCollection and useCollectionByPermalink for consistent behavior.
 * @param params The collection params - either {collectionId}, {handle, slug, type}, or {permalink}
 * @returns The collection data or null if not found
 */
export const useCollectionByParams = (
  params: CollectionParams,
  options?: QueryOptions
) => {
  const dispatch = useDispatch()

  let permalink: string | null | undefined = null
  if ('permalink' in params) {
    permalink = params.permalink
  } else if ('handle' in params) {
    permalink = `/${params.handle}/${params.collectionType}/${params.slug}`
  }

  const collectionId = 'collectionId' in params ? params.collectionId : null

  const idQuery = useCollection(collectionId, options)
  const permalinkQuery = useCollectionByPermalink(permalink, options)

  const query = collectionId ? idQuery : permalinkQuery

  const { isSuccess } = query
  const collectionIdResult = query.data?.playlist_id

  useEffect(() => {
    if (isSuccess && collectionIdResult) {
      dispatch(
        collectionPageActions.fetchCollectionSucceeded(collectionIdResult)
      )

      dispatch(
        collectionPageLineupActions.fetchLineupMetadatas(
          0,
          // TODO: lineups should be paginated
          100,
          false,
          undefined
        )
      )
    }
  }, [isSuccess, collectionIdResult, dispatch])

  return query
}
