import { ID } from '@audius/common/src/models/Identifiers'
import { getUser } from '@audius/common/src/store/cache/users/selectors'
import { Flex } from '@audius/harmony/src/components/layout/Flex'

import { useSelector } from 'utils/reducer'

export type OwnProps = {
  userId: ID
}

export const ServerProfilePage = ({ userId }: OwnProps) => {
  const user = useSelector((state) => getUser(state, { id: userId }))
  if (!user) return null

  return <Flex w='100%' direction='column' />
}
