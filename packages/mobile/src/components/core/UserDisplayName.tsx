import { cacheUsersSelectors } from '@audius/common'
import { useSelectTierInfo } from '@audius/common/hooks'
import type { ID } from '@audius/common/models'
import { useSelector } from 'react-redux'

import type { TextProps } from '@audius/harmony-native'
import {
  Flex,
  IconVerified,
  Text,
  useTheme,
  variantStylesMap
} from '@audius/harmony-native'

import { IconAudioBadge } from './IconAudioBadge'

const { getUser } = cacheUsersSelectors

type UserDisplayProps = TextProps & {
  userId: ID
}

export const UserDisplayName = (props: UserDisplayProps) => {
  const { userId, variant = 'title', size = 's', style, ...other } = props
  const { tier, isVerified } = useSelectTierInfo(userId)
  const displayName = useSelector(
    (state) => getUser(state, { id: userId })?.name
  )
  const { typography } = useTheme()
  const fontSize = typography.size[variantStylesMap[variant].fontSize[size]]
  const badgeSize = fontSize - 2

  return (
    <Flex direction='row' gap='xs' alignItems='center' style={style}>
      <Text variant={variant} size={size} {...other}>
        {displayName}
      </Text>
      {isVerified ? (
        <IconVerified height={badgeSize} width={badgeSize} />
      ) : null}
      <IconAudioBadge tier={tier} height={fontSize} width={fontSize} />
    </Flex>
  )
}
