import { useCallback, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import { ID } from 'models/Identifiers'
import { Status } from 'models/Status'
import { CommonState } from 'store/index'
import { getFetchedCollectionIds } from 'store/saved-collections/selectors'

import {
  CollectionType,
  savedCollectionsActions,
  savedCollectionsSelectors
} from '../store/saved-collections'

const { fetchCollections } = savedCollectionsActions

const { getAccountAlbums, getSavedCollectionsState, getAccountPlaylists } =
  savedCollectionsSelectors

const DEFAULT_PAGE_SIZE = 50

export function useSavedAlbums() {
  return useSelector(getAccountAlbums)
}

export function useSavedPlaylists() {
  return useSelector(getAccountPlaylists)
}

type UseFetchedCollectionsConfig = {
  collectionIds: ID[]
  type: CollectionType
  pageSize?: number
}

type UseFetchedSavedCollectionsResult = {
  /** A list of IDs representing the subset of requested collections which have been fetched */
  data: ID[]
  /** The current fetching state of the list of collections requested */
  status: Status
  /** Whether any items remain unfetched */
  hasMore: boolean
  /** Triggers fetching of the next page of items */
  fetchMore: () => void
}
/** Given a list of collectionIds and a type ('albums' or 'playlists'), returns state
 * necessary to display a list of fully-fetched collections of that type, as well as
 * load any remaining items which haven't been fetched.
 */
export function useFetchedSavedCollections({
  collectionIds,
  type,
  pageSize = DEFAULT_PAGE_SIZE
}: UseFetchedCollectionsConfig): UseFetchedSavedCollectionsResult {
  const dispatch = useDispatch()

  const { status } = useSelector((state: CommonState) =>
    getSavedCollectionsState(state, type)
  )
  const fetchedCollectionIDs = useSelector(getFetchedCollectionIds)

  const { unfetched, fetched } = useMemo(() => {
    const fetchedSet = new Set(fetchedCollectionIDs)
    return collectionIds.reduce<{ fetched: ID[]; unfetched: ID[] }>(
      (accum, id) => {
        if (fetchedSet.has(id)) {
          accum.fetched.push(id)
        } else {
          accum.unfetched.push(id)
        }
        return accum
      },
      { fetched: [], unfetched: [] }
    )
  }, [collectionIds, fetchedCollectionIDs])

  const fetchMore = useCallback(() => {
    if (status === Status.LOADING || unfetched.length === 0) {
      return
    }
    const ids = unfetched.slice(0, Math.min(pageSize, unfetched.length))
    dispatch(fetchCollections({ type, ids }))
  }, [status, unfetched, pageSize, type, dispatch])

  return {
    data: fetched,
    status,
    hasMore: unfetched.length > 0,
    fetchMore
  }
}
