import type { User } from '@audius/common/models'
import { css } from '@emotion/native'
import { TouchableOpacity } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'

import type { AppTabScreenParamList } from '../app-screen'

export const UserChatHeader = ({ user }: { user: User }) => {
  const navigation = useNavigation<AppTabScreenParamList>()
  return (
    <Flex
      style={css({
        maxWidth: '70%'
      })}
    >
      <TouchableOpacity
        onPress={() => navigation.push('Profile', { id: user.user_id })}
      >
        <Flex
          direction='row'
          justifyContent='center'
          alignItems='center'
          gap='s'
        >
          <ProfilePicture
            userId={user.user_id}
            size='small'
            strokeWidth='thin'
          />
          <UserLink userId={user.user_id} textVariant='title' />
        </Flex>
      </TouchableOpacity>
    </Flex>
  )
}
