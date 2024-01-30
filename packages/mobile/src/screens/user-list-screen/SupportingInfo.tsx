import { tippingSelectors, supportingUserListSelectors } from '@audius/common'
import type { User } from '@audius/common/models'
import { useSelector } from 'react-redux'

import { Tip } from './Tip'
const { getId: getSupportingId } = supportingUserListSelectors
const { getOptimisticSupporting } = tippingSelectors

type SupportingInfoProps = {
  user: User
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportingId = useSelector(getSupportingId)
  const supportingForUser = supportingId
    ? supportingMap[supportingId] ?? null
    : null
  const supporting = supportingForUser?.[props.user.user_id] ?? null

  return supporting ? <Tip amount={supporting.amount} /> : null
}
