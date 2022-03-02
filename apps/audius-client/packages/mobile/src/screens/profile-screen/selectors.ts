import { makeGetLineupMetadatas } from 'audius-client/src/common/store/lineup/selectors'
import {
  getProfileFeedLineup,
  getProfileTracksLineup,
  makeGetProfile
} from 'audius-client/src/common/store/pages/profile/selectors'
import { isEqual } from 'lodash'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

export const getProfile = makeGetProfile()

export const useProfileTracksLineup = () => {
  return useSelectorWeb(getProfileTracksLineup, isEqual)
}

export const useProfileAlbums = () => useSelectorWeb(getProfile, isEqual)

export const useProfilePlaylists = () => useSelectorWeb(getProfile, isEqual)

const getUserFeedMetadatas = makeGetLineupMetadatas(getProfileFeedLineup)

export const useProfileFeedLineup = () => {
  return useSelectorWeb(getUserFeedMetadatas, isEqual)
}
