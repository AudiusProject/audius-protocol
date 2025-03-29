import { full } from '@audius/sdk'
import { AnyAction, Dispatch } from 'redux'

import {
  transformAndCleanList,
  userTrackMetadataFromSDK,
  userMetadataFromSDK
} from '~/adapters'

import { TypedQueryClient } from '../typed-query-client'

import { primeTrackData } from './primeTrackData'
import { primeUserData } from './primeUserData'

/**
 * Utility function to prime related data from API responses
 * This handles both users and tracks that may be included in the related field
 */
export const primeRelatedData = ({
  related,
  queryClient,
  dispatch,
  forceReplace = false,
  skipQueryData = false
}: {
  related: full.Related | undefined
  queryClient: TypedQueryClient
  dispatch: Dispatch<AnyAction>
  forceReplace?: boolean
  skipQueryData?: boolean
}) => {
  if (!related) return

  const { users, tracks } = related

  // Prime user data if available
  if (users && users.length > 0) {
    primeUserData({
      users: transformAndCleanList(users, userMetadataFromSDK),
      queryClient,
      dispatch,
      forceReplace,
      skipQueryData
    })
  }

  // Prime track data if available
  if (tracks && tracks.length > 0) {
    primeTrackData({
      tracks: transformAndCleanList(tracks, userTrackMetadataFromSDK),
      queryClient,
      dispatch,
      forceReplace,
      skipQueryData
    })
  }
}
