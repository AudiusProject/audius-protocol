import {
  accountSelectors,
  processAndCacheUsers,
  getContext
} from '@audius/common/store'

import { ID, UserMetadata, User } from '@audius/common/models'
import { AudiusAPIClient, AudiusBackend } from '@audius/common/services'
import { call, select } from 'typed-redux-saga'

import { AppState } from 'store/types'
import { waitForRead } from 'utils/sagaHelpers'

const { getAccountUser, getUserId } = accountSelectors

export type UserListProviderArgs<T, U = void> = {
  // Gets the track or playlist we're referencing.
  getExistingEntity: (state: AppState, props: { id: ID }) => T | null

  // Pull out a subset of IDs from the entity that
  // we want to sort to the top of the user list.
  // e.g. followee reposts on a track
  extractUserIDSubsetFromEntity: (entity: T) => ID[]

  // Fetch all the relevant users for the entity.
  // e.g. all users who've reposted a track.
  fetchAllUsersForEntity: (args: {
    limit: number
    offset: number
    entityId: ID
    currentUserId: ID | null
    audiusBackendInstance: AudiusBackend
    apiClient: AudiusAPIClient
  }) => Promise<{ users: UserMetadata[]; extra?: U }>

  includeCurrentUser: (entity: T) => boolean

  // Select the User IDs we're already showing in the list.
  selectCurrentUserIDsInList: (state: AppState) => ID[]

  // Given the fully combined list of Users we're going to show,
  // are there still more users we page to?
  canFetchMoreUsers: (entity: T, combinedUserIDs: ID[]) => boolean

  processExtra?: (extra: U) => Generator<any, any, any>
}

// Helper function to provide users from multiple sources. Super useful
// when you follow a pattern of pulling a subset of users out of an entity (track/collection)
// that should be on the top of the list, and then combining it with all users.
//
// e.g. sort followee_reposts on the top of the track repost list.
//
// This is not included in the UserList fetching logic itself because UserList
// should support usecases that don't require this type of combining logic.
export function createUserListProvider<T, U = void>({
  getExistingEntity,
  extractUserIDSubsetFromEntity,
  fetchAllUsersForEntity,
  includeCurrentUser,
  selectCurrentUserIDsInList,
  canFetchMoreUsers,
  processExtra
}: UserListProviderArgs<T, U>) {
  return function* userListProvider({
    id,
    currentPage,
    pageSize
  }: {
    id: number
    currentPage: number
    pageSize: number
  }) {
    yield* waitForRead()
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')
    const apiClient = yield* getContext('apiClient')
    const existingEntity: T | null = yield* select(getExistingEntity, { id })
    if (!existingEntity) return { userIds: [], hasMore: false }

    const subsetIds = extractUserIDSubsetFromEntity(existingEntity)
    const subsetIdSet = new Set(subsetIds)

    const userId = yield* select(getUserId)
    // Get the next page of users
    const offset = currentPage * pageSize
    const { users: allUsers, extra } = yield* call(fetchAllUsersForEntity, {
      limit: pageSize,
      offset,
      entityId: id,
      currentUserId: userId,
      audiusBackendInstance,
      apiClient
    })
    if (includeCurrentUser(existingEntity)) {
      const currentUser = yield* select(getAccountUser)
      if (currentUser) {
        allUsers.push(currentUser)
      }
    }

    // Perform extra processing if applicable
    if (processExtra) {
      // @ts-ignore -- TODO: this is a tough one
      yield* call(processExtra, extra)
    }

    // Filter out users from subsetIdSet
    const filteredUserIDs = allUsers
      .map((u) => u.user_id)
      .filter((id) => !subsetIdSet.has(id))

    // Get the existing users in the store
    const existingUserIDs = yield* select(selectCurrentUserIDsInList)

    // Construct a new user list,
    // only prepending the subset users if
    // we haven't already.
    let combinedUserIds = (() => {
      if (currentPage === 0)
        return [...subsetIds, ...existingUserIDs, ...filteredUserIDs]
      return [...existingUserIDs, ...filteredUserIDs]
    })()
    // Filter duplicates
    combinedUserIds = [...new Set(combinedUserIds)]

    // Insert new users into the cache
    yield* processAndCacheUsers(allUsers as User[])
    const hasMoreUsers = canFetchMoreUsers(existingEntity, combinedUserIds)

    return { userIds: combinedUserIds, hasMore: hasMoreUsers }
  }
}
