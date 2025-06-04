import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { useTierAndVerifiedForUser } from '@audius/common/store'

import type { TextProps } from '@audius/harmony-native'
import {
  Flex,
  IconVerified,
  Text,
  useTheme,
  variantStylesMap
} from '@audius/harmony-native'

import { IconAudioBadge } from './IconAudioBadge'

type UserDisplayProps = TextProps & {
  userId: ID
}

export const UserDisplayName = (props: UserDisplayProps) => {
  const { userId, variant = 'title', size = 's', style, ...other } = props
  const { tier, isVerified } = useTierAndVerifiedForUser(userId)
  const { data: userName } = useUser(userId, {
    select: (user) => user?.name
  })
  const { typography } = useTheme()
  const fontSize = typography.size[variantStylesMap[variant].fontSize[size]]
  const badgeSize = fontSize - 2

  return (
    <Flex
      row
      gap='xs'
      alignItems='center'
      style={style}
      ph={isVerified ? 'xl' : 'l'}
    >
      <Text ellipses variant={variant} size={size} {...other} numberOfLines={1}>
        {userName}
      </Text>
      {isVerified ? (
        <IconVerified height={badgeSize} width={badgeSize} />
      ) : null}
      <IconAudioBadge tier={tier} height={fontSize} width={fontSize} />
    </Flex>
  )
}
