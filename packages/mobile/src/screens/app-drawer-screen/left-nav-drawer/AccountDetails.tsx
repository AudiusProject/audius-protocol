import { useCallback, useContext } from 'react'

import type { User } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

import { Flex, Text } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { UserBadges } from 'app/components/user-badges'
import { makeStyles } from 'app/styles'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

const { getAccountUser } = accountSelectors

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
  const accountUser = useSelector(getAccountUser) as User
  const { name, handle } = accountUser

  const navigation = useAppDrawerNavigation()

  const handlePressAccount = useCallback(() => {
    navigation.push('Profile', { handle: 'accountUser' })
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

  return (
    <TouchableOpacity onPress={handlePressAccount}>
      <Flex gap='m' ph='xl'>
        <ProfilePicture
          userId={accountUser.user_id}
          h={77}
          w={77}
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
