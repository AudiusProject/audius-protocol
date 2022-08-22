import type { User } from '@audius/common'
import { tippingSelectors, supportingUserListSelectors } from '@audius/common'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'

import { Tip } from './Tip'
const { getId: getSupportingId } = supportingUserListSelectors
const { getOptimisticSupporting } = tippingSelectors

type SupportingInfoProps = {
  user: User
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const supportingMap = useSelectorWeb(getOptimisticSupporting)
  const supportingId = useSelectorWeb(getSupportingId)
  const supportingForUser = supportingId
    ? supportingMap[supportingId] ?? null
    : null
  const supporting = supportingForUser?.[props.user.user_id] ?? null

  return supporting ? <Tip amount={supporting.amount} /> : null
}
