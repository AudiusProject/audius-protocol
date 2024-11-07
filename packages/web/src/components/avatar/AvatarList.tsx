import { ID } from '@audius/common/models'
import { Flex } from '@audius/harmony'

import { Avatar, AvatarProps } from './Avatar'

type AvatarListProps = {
  users: ID[]
  avatarProps?: Partial<AvatarProps>
}

export const AvatarList = (props: AvatarListProps) => {
  const { users, avatarProps } = props
  return (
    <Flex alignItems='center'>
      {users.slice(0, 3).map((user, index) => (
        <Avatar
          key={user}
          userId={user}
          size='small'
          css={{ marginRight: index === 2 ? 0 : -4.8, zIndex: 3 - index }}
          {...avatarProps}
        />
      ))}
    </Flex>
  )
}
