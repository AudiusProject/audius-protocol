import { useCallback, useContext } from 'react'

import { useCurrentAccountUser } from '@audius/common/api'
import { TouchableOpacity } from 'react-native'

import { Flex, Text } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserBadges } from 'app/components/user-badges'
import { makeStyles } from 'app/styles'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingLeft: spacing(4),
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between'
  },
  accountBadges: {
    flexGrow: 1,
    alignSelf: 'center'
  }
}))

export const AccountDetails = () => {
  const { drawerHelpers } = useContext(AppDrawerContext)
  const styles = useStyles()
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
    navigation.push('Profile', { handle: 'accountUser' })
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

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
            <UserBadges
              user={accountUser}
              hideName
              style={styles.accountBadges}
            />
          </Flex>
          <Text numberOfLines={1} variant='body' size='s'>
            @{handle}
          </Text>
        </Flex>
      </Flex>
    </TouchableOpacity>
  )
}
