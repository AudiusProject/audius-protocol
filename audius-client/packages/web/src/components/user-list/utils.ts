import { call, select } from 'redux-saga/effects'

import { ID } from 'common/models/Identifiers'
import { User, UserMetadata } from 'common/models/User'
import { getAccountUser, getUserId } from 'common/store/account/selectors'
import { processAndCacheUsers } from 'common/store/cache/users/utils'
import { AppState } from 'store/types'

export type UserListProviderArgs<T> = {
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
  }) => Promise<UserMetadata[]>

  includeCurrentUser: (entity: T) => boolean

  // Select the User IDs we're already showing in the list.
  selectCurrentUserIDsInList: (state: AppState) => ID[]

  // Given the fully combined list of Users we're going to show,
  // are there still more users we page to?
  canFetchMoreUsers: (entity: T, combinedUserIDs: ID[]) => boolean
}

// Helper function to provide users from multiple sources. Super useful
// when you follow a pattern of pulling a subset of users out of an entity (track/collection)
// that should be on the top of the list, and then combining it with all users.
//
// e.g. sort followee_reposts on the top of the track repost list.
//
// This is not included in the UserList fetching logic itself because UserList
// should support usecases that don't require this type of combining logic.
export function createUserListProvider<T>({
  getExistingEntity,
  extractUserIDSubsetFromEntity,
  fetchAllUsersForEntity,
  includeCurrentUser,
  selectCurrentUserIDsInList,
  canFetchMoreUsers
}: UserListProviderArgs<T>) {
  return function* userListProvider({
    id,
    currentPage,
    pageSize
  }: {
    id: number
    currentPage: number
    pageSize: number
  }) {
    const existingEntity: T | null = yield select(getExistingEntity, { id })
    if (!existingEntity) return { userIds: [], hasMore: false }

    const subsetIds = extractUserIDSubsetFromEntity(existingEntity)
    const subsetIdSet = new Set(subsetIds)

    const userId = yield select(getUserId)
    // Get the next page of users
    const offset = currentPage * pageSize
    const allUsers: User[] = yield call(fetchAllUsersForEntity, {
      limit: pageSize,
      offset,
      entityId: id,
      currentUserId: userId
    })
    if (includeCurrentUser(existingEntity)) {
      const currentUser = yield select(getAccountUser)
      allUsers.push(currentUser)
    }

    // Filter out users from subsetIdSet
    const filteredUserIDs = allUsers
      .map(u => u.user_id)
      .filter(id => !subsetIdSet.has(id))

    // Get the existing users in the store
    const existingUserIDs: number[] = yield select(selectCurrentUserIDsInList)

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
    yield processAndCacheUsers(allUsers)
    const hasMoreUsers = canFetchMoreUsers(existingEntity, combinedUserIds)

    return { userIds: combinedUserIds, hasMore: hasMoreUsers }
  }
}
