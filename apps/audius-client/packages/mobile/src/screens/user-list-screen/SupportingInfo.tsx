import { ID } from 'audius-client/src/common/models/Identifiers'
import { User } from 'audius-client/src/common/models/User'
import { getUserId } from 'audius-client/src/common/store/account/selectors'
import { getSupportedUserByUser } from 'audius-client/src/common/store/tipping/selectors'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { Tip } from './Tip'

type SupporterInfoProps = {
  user: User
}

export const SupportingInfo = (props: SupporterInfoProps) => {
  const { user } = props
  const { user_id: supportingUserId } = user
  const currentUserId = useSelectorWeb(getUserId) as ID
  const supporter = useSelectorWeb(state =>
    getSupportedUserByUser(state, currentUserId, supportingUserId)
  )

  if (!supporter) return null

  const { amount } = supporter

  return <Tip amount={amount} />
}
