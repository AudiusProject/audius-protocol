import { useSupporter } from '@audius/common/api'
import type { ID } from '@audius/common/models'

import { useRoute } from 'app/hooks/useRoute'

import { Tip } from './Tip'

type SupportingInfoProps = {
  userId: ID
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const { userId } = props

  const {
    params: { userId: supportingId }
  } = useRoute<'SupportingUsers'>()

  const { data: supportFor } = useSupporter({
    userId,
    supporterUserId: supportingId
  })

  const amount = supportFor?.amount

  return <Tip amount={amount} />
}
