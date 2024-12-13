import { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { TextLink } from '@audius/harmony'

import { UserLink } from 'components/link'
import { useSelector } from 'utils/reducer'

const { getIsGuestUser } = cacheUsersSelectors

type BuyerUserLinkProps = {
  userId: ID
}

export const BuyerUserLink = ({ userId }: BuyerUserLinkProps) => {
  const isGuestUser = useSelector((state) =>
    getIsGuestUser(state, { id: userId })
  )

  if (isGuestUser) {
    return (
      <TextLink variant='subdued' disabled>
        Guest Checkout
      </TextLink>
    )
  }

  return <UserLink popover userId={userId} />
}
