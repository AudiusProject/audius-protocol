import { Status } from '@audius/common/models'
import { profilePageSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import { useRoute } from 'app/hooks/useRoute'

const { getProfileStatus, makeGetProfile } = profilePageSelectors

export const getProfile = makeGetProfile()

export const useIsProfileLoaded = () => {
  const { params } = useRoute<'Profile'>()
  const { handle } = params
  const profileStatus = useSelector((state) =>
    getProfileStatus(state, handle?.toLowerCase())
  )

  return handle === 'accountUser' || profileStatus === Status.SUCCESS
}
