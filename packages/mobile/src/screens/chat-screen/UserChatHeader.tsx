import type { User } from '@audius/common/models'
import { css } from '@emotion/native'

import { Flex } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserLink } from 'app/components/user-link'

export const UserChatHeader = ({ user }: { user: User }) => {
  return (
    <Flex
      direction='row'
      justifyContent='center'
      alignItems='center'
      style={css({
        maxWidth: '70%'
      })}
      gap='s'
    >
      <ProfilePicture userId={user.user_id} size='small' strokeWidth='thin' />
      <UserLink userId={user.user_id} textVariant='title' />
    </Flex>
  )
}
