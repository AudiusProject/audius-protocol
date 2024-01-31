import { accountSelectors } from '@audius/common/store'
import { useCallback, useContext } from 'react'

import type { User } from '@audius/common/models'
import { TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { ProfilePicture } from 'app/components/user'
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
  accountImage: {
    height: spacing(12.5),
    width: spacing(12.5),
    marginBottom: spacing(3),
    borderWidth: 1
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
        <ProfilePicture profile={accountUser} style={styles.accountImage} />
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
