import { useCallback, useContext } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { TouchableOpacity } from 'react-native'

import { Flex, Text } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserBadges } from 'app/components/user-badges'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

export const AccountDetails = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  const { data: accountUser } = useCurrentAccountUser({
    select: (user) => ({
      user_id: user?.user_id,
      name: user?.name,
      handle: user?.handle,
      is_verified: user?.is_verified
    })
  })
  const { name, handle, user_id } = accountUser ?? {}

  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    if (handle) {
      navigation.push('Profile', { handle })
      drawerHelpers.closeDrawer()
    }
  }, [handle, navigation, drawerHelpers])

  return (
    <TouchableOpacity onPress={handlePressAccount}>
      <Flex gap='m' ph='xl'>
        <ProfilePicture
          userId={user_id}
          h='unit20'
          w='unit20'
          borderWidth='thin'
        />
        <Flex gap='unitHalf'>
          <Flex row justifyContent='space-around'>
            <Text numberOfLines={1} variant='body' size='l' strength='strong'>
              {name}
            </Text>
            {user_id ? <UserBadges userId={user_id} badgeSize='xs' /> : null}
          </Flex>
          <Text numberOfLines={1} variant='body' size='s'>
            @{handle}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  )
}
