import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { getProfileUser } from 'audius-client/src/common/store/pages/profile/selectors'
import { isEqual } from 'lodash'

import { useSelectorWeb } from './useSelectorWeb'

export const useProfile = () => {
  return useSelectorWeb(getProfileUser, isEqual)
}

export const useAccountUser = () => {
  return useSelectorWeb(getAccountUser, isEqual)
}
