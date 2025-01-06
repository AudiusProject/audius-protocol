import type { User } from '@audius/common/models'

import { Tip } from './Tip'

type SupportingInfoProps = {
  user: User
}

export const SupportingInfo = (props: SupportingInfoProps) => {
  const supporting = null

  // @ts-expect-error
  return supporting ? <Tip amount={supporting.amount} /> : null
}
