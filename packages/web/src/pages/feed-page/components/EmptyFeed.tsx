import { accountSelectors } from '@audius/common/store'

import { useRequiresAccount } from 'hooks/useRequiresAccount'
import { useSelector } from 'utils/reducer'

import FollowArtists from './FollowUsers'

const EmptyFeed = () => {
  const hasAccount = useSelector(accountSelectors.getHasAccount)
  useRequiresAccount()

  return hasAccount ? <FollowArtists /> : null
}

export default EmptyFeed
