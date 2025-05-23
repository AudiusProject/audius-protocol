import { useHasAccount } from '@audius/common/api'

import { useRequiresAccount } from 'hooks/useRequiresAccount'

import FollowArtists from './FollowUsers'

const EmptyFeed = () => {
  const hasAccount = useHasAccount()
  useRequiresAccount()

  return hasAccount ? <FollowArtists /> : null
}

export default EmptyFeed
