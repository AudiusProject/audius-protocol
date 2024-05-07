import type { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { TextLinkProps } from '@audius/harmony-native'
import { TextLink, Flex } from '@audius/harmony-native'
import type { AppTabScreenParamList } from 'app/screens/app-screen'

import { UserBadges } from '../user-badges/UserBadges2'

const { getUser } = cacheUsersSelectors

type ParamList = Pick<AppTabScreenParamList, 'Profile'>

type UserLinkProps = Omit<TextLinkProps<ParamList>, 'to' | 'children'> & {
  userId: ID
}

export const UserLink = (props: UserLinkProps) => {
  const { userId, ...other } = props
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

  return (
    <Flex direction='row' gap='xs' justifyContent='center' alignItems='center'>
      <TextLink<ParamList>
        to={{ screen: 'Profile', params: { id: userId } }}
        numberOfLines={1}
        shrink
        {...other}
      >
        {userName}
      </TextLink>
      <UserBadges userId={userId} />
    </Flex>
  )
}
