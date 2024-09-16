import type { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { useSelector } from 'react-redux'

import type { IconSize, TextLinkProps } from '@audius/harmony-native'
import { TextLink } from '@audius/harmony-native'
import type { AppTabScreenParamList } from 'app/screens/app-screen'

import { UserBadgesV2 } from '../user-badges/UserBadgesV2'

const { getUser } = cacheUsersSelectors

type ParamList = Pick<AppTabScreenParamList, 'Profile'>

type UserLinkProps = Omit<TextLinkProps<ParamList>, 'to' | 'children'> & {
  userId: ID
  badgeSize?: IconSize
}

export const UserLink = (props: UserLinkProps) => {
  const { userId, badgeSize = 's', ...other } = props
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

  return (
    <TextLink<ParamList>
      to={{ screen: 'Profile', params: { id: userId } }}
      numberOfLines={1}
      flexShrink={1}
      endAdornment={<UserBadgesV2 userId={userId} badgeSize={badgeSize} />}
      {...other}
    >
      {userName}
    </TextLink>
  )
}
