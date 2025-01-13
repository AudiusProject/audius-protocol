import { useCallback, useContext } from 'react'

import type { User } from '@audius/common/models'
import {
  accountSelectors,
  followingUserListActions,
  followersUserListActions
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import { Divider, Flex, Text } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

const { getAccountUser } = accountSelectors
const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions

const messages = {
  followers: 'Followers',
  following: 'Following'
}

const vanityMetricHitSlop = {
  top: spacing(2),
  right: spacing(2),
  bottom: spacing(2),
  left: spacing(2)
}

const useVanityMetricStyles = makeStyles(({ spacing }) => ({
  vanityMetric: {
    flexDirection: 'row',
    alignItems: 'center'
  }
}))

type VanityMetricProps = {
  onPress: () => void
  metric: number
  label: string
}

const VanityMetric = (props: VanityMetricProps) => {
  const { onPress, metric, label } = props
  const styles = useVanityMetricStyles()

  return (
    <TouchableOpacity
      style={styles.vanityMetric}
      onPress={onPress}
      hitSlop={vanityMetricHitSlop}
    >
      <Flex gap='xs' row>
        <Text variant='body' size='s'>
          {formatCount(metric)}
        </Text>
        <Text variant='body' size='s' color='subdued'>
          {label}
        </Text>
      </Flex>
    </TouchableOpacity>
  )
}

export const VanityMetrics = () => {
  const accountUser = useSelector(getAccountUser) as User
  const { user_id, followee_count, follower_count } = accountUser

  const dispatch = useDispatch()
  const navigation = useAppDrawerNavigation()
  const { drawerHelpers } = useContext(AppDrawerContext)

  const handlePressFollowing = useCallback(() => {
    dispatch(setFollowing(user_id))
    navigation.push('Following', { userId: user_id })
    drawerHelpers.closeDrawer()
  }, [dispatch, user_id, navigation, drawerHelpers])

  const handlePressFollowers = useCallback(() => {
    dispatch(setFollowers(user_id))
    navigation.push('Followers', { userId: user_id })
    drawerHelpers.closeDrawer()
  }, [dispatch, user_id, navigation, drawerHelpers])

  return (
    <>
      <Flex row ph='xl' pt='s' pb='l' gap='xl'>
        <VanityMetric
          metric={follower_count}
          onPress={handlePressFollowers}
          label={messages.followers}
        />
        <VanityMetric
          metric={followee_count}
          onPress={handlePressFollowing}
          label={messages.following}
        />
      </Flex>
      <Divider />
    </>
  )
}
