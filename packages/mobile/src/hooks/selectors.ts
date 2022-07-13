import { getProfileUser } from 'audius-client/src/common/store/pages/profile/selectors'

import { isEqual, useSelectorWeb } from './useSelectorWeb'

export const useProfile = (params?: { handle?: string }) => {
  return useSelectorWeb((state) => getProfileUser(state, params), isEqual)
}
