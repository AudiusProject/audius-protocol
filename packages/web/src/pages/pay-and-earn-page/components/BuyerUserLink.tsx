import { useUser } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { TextLink } from '@audius/harmony'

import { UserLink } from 'components/link'

type BuyerUserLinkProps = {
  userId: ID
}

export const BuyerUserLink = ({ userId }: BuyerUserLinkProps) => {
  const { data: partialUser } = useUser(userId, {
    select: (user) => ({
      handle: user?.handle,
      name: user?.name
    })
  })
  const isGuestUser = !partialUser?.handle && !partialUser?.name

  if (isGuestUser) {
    return (
      <TextLink variant='subdued' disabled>
        Guest Checkout
      </TextLink>
    )
  }

  return <UserLink popover userId={userId} />
}
