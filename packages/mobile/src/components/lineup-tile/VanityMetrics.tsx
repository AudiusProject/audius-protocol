import type { ReactNode } from 'react'

import type { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

import type { IconComponent } from '@audius/harmony-native'
import { DEFAULT_HIT_SLOP, Flex, Text } from '@audius/harmony-native'

const { getUser } = cacheUsersSelectors

type VanityMetricProps = {
  icon?: IconComponent
  children?: ReactNode
  onPress?: () => void
  disabled?: boolean
}

export const VanityMetric = (props: VanityMetricProps) => {
  const { icon: Icon, children, onPress, disabled } = props

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={DEFAULT_HIT_SLOP}
    >
      <Flex row alignItems='center' gap='xs'>
        {Icon ? <Icon size='s' color='subdued' /> : null}
        <Text size='xs' color='subdued'>
          {children}
        </Text>
      </Flex>
    </TouchableOpacity>
  )
}

export const UserName = (props: { userId: ID }) => {
  const { userId } = props
  const userName = useSelector((state) => getUser(state, { id: userId })?.name)

  return <Text>{userName}</Text>
}
