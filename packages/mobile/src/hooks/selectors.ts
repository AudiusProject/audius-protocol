import { profilePageSelectors } from '@audius/common'

import { isEqual, useSelectorWeb } from './useSelectorWeb'
const { getProfileUser } = profilePageSelectors

export const useProfile = (params?: { handle?: string }) => {
  return useSelectorWeb((state) => getProfileUser(state, params), isEqual)
}
