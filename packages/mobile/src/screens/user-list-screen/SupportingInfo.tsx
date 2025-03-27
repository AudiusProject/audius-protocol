import type { ID } from '@audius/common/models'
import {
  tippingSelectors,
  supportingUserListSelectors
} from '@audius/common/store'
import { useSelector } from 'react-redux'

import { Tip } from './Tip'
const { getId: getSupportingId } = supportingUserListSelectors
const { getOptimisticSupporting } = tippingSelectors

type SupportingInfoProps = {
  userId: ID
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const supportingMap = useSelector(getOptimisticSupporting)
  const supportingId = useSelector(getSupportingId)
  const supportingForUser = supportingId
    ? (supportingMap[supportingId] ?? null)
    : null
  const supporting = supportingForUser?.[props.userId] ?? null

  return supporting ? <Tip amount={supporting.amount} /> : null
}
