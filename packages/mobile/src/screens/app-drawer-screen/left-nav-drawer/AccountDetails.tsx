import { useCallback, useContext } from 'react'

import type { User } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text, ProfilePicture } from 'app/components/core'
import UserBadges from 'app/components/user-badges'
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
  accountName: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingRight: spacing(2)
  },
  name: {
    flexShrink: 1
  },
  accountBadges: {
    flexGrow: 1,
    alignSelf: 'center'
  },
  handle: {
    paddingRight: spacing(3)
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
    <View style={styles.root}>
      <TouchableOpacity onPress={handlePressAccount}>
        <ProfilePicture
          userId={accountUser.user_id}
          h={50}
          w={50}
          mb='l'
          borderWidth='thin'
        />
        <View style={styles.accountName}>
          <Text numberOfLines={1} style={styles.name} variant='h1' noGutter>
            {name}
          </Text>
          <UserBadges
            user={accountUser}
            hideName
            style={styles.accountBadges}
          />
        </View>
        <Text
          style={styles.handle}
          numberOfLines={1}
          weight='medium'
          fontSize='medium'
        >
          @{handle}
        </Text>
      </TouchableOpacity>
    </View>
  )
}
