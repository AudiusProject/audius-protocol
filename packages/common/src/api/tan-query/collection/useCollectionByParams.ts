import { ID } from '~/models/Identifiers'
import { CollectionsPageType } from '~/store/pages'

import { TQCollection } from '../models'
import { SelectableQueryOptions } from '../types'

import { useCollection } from './useCollection'
import { useCollectionByPermalink } from './useCollectionByPermalink'

type CollectionParams =
  | { collectionId?: ID }
  | {
      handle?: string
      slug?: string
      collectionType?: CollectionsPageType
    }
  | { permalink?: string }

/**
 * Hook that returns collection data given either a collection ID, handle+slug+type, or permalink.
 * Internally uses useCollection and useCollectionByPermalink for consistent behavior.
 * @param params The collection params - either {collectionId}, {handle, slug, type}, or {permalink}
 * @returns The collection data or null if not found
 */
export const useCollectionByParams = <
  TResult extends { playlist_id: ID } = TQCollection
>(
  params: CollectionParams | null = {},
  options?: SelectableQueryOptions<TQCollection, TResult>
) => {
  let permalink: string | null | undefined = null
  params = params ?? {}
  if ('permalink' in params) {
    permalink = params.permalink
  } else if ('handle' in params) {
    permalink = `/${params.handle}/${params.collectionType}/${params.slug}`
  }

  const collectionId = 'collectionId' in params ? params.collectionId : null

  const idQuery = useCollection(collectionId, options)
  const permalinkQuery = useCollectionByPermalink(permalink, options)

  const query = collectionId ? idQuery : permalinkQuery

  return query
}
