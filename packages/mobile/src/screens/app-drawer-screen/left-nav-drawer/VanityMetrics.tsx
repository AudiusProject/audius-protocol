import type { ComponentType } from 'react'
import { useCallback, useContext } from 'react'

import type { User } from '@audius/common/models'
import {
  accountSelectors,
  followingUserListActions,
  followersUserListActions
} from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import type { SvgProps } from 'react-native-svg'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconNote,
  IconPlaylists,
  IconUserFollowers,
  IconUserList
} from '@audius/harmony-native'
import { Divider, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { AppDrawerContext } from '../AppDrawerContext'
import { useAppDrawerNavigation } from '../useAppDrawerNavigation'

const { getAccountUser } = accountSelectors
const { setFollowers } = followersUserListActions
const { setFollowing } = followingUserListActions

const vanityMetricHitSlop = {
  top: spacing(2),
  right: spacing(2),
  bottom: spacing(2),
  left: spacing(2)
}

const useVanityMetricStyles = makeStyles(({ spacing }) => ({
  vanityMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing(4)
  },
  vanityMetricIcon: {
    marginRight: spacing(1)
  }
}))

type VanityMetricProps = {
  onPress: () => void
  icon: ComponentType<SvgProps>
  iconProps?: SvgProps
  metric: number
}

const VanityMetric = (props: VanityMetricProps) => {
  const { onPress, icon: Icon, iconProps, metric } = props
  const styles = useVanityMetricStyles()
  const { neutralLight4 } = useThemeColors()
  const iconStyle = iconProps?.style

  return (
    <TouchableOpacity
      style={styles.vanityMetric}
      onPress={onPress}
      hitSlop={vanityMetricHitSlop}
    >
      <Icon
        {...iconProps}
        fill={neutralLight4}
        style={[styles.vanityMetricIcon, iconStyle]}
        height={22}
        width={22}
      />
      <View>
        <Text fontSize='large' weight='heavy'>
          {formatCount(metric)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const useStyles = makeStyles(({ spacing }) => ({
  divider: {
    marginVertical: spacing(4)
  },
  verticalDivider: {
    marginHorizontal: spacing(2)
  },
  vanityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: spacing(4)
  }
}))

export const VanityMetrics = () => {
  const styles = useStyles()
  const accountUser = useSelector(getAccountUser) as User
  const {
    user_id,
    track_count,
    playlist_count,
    followee_count,
    follower_count
  } = accountUser

  const dispatch = useDispatch()
  const navigation = useAppDrawerNavigation()
  const { drawerHelpers } = useContext(AppDrawerContext)

  const handlePressAccount = useCallback(() => {
    navigation.push('Profile', { handle: 'accountUser' })
    drawerHelpers.closeDrawer()
  }, [navigation, drawerHelpers])

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
      <Divider style={styles.divider} />
      <View style={styles.vanityMetrics}>
        {track_count === 0 ? (
          <VanityMetric
            metric={playlist_count}
            onPress={handlePressAccount}
            icon={IconPlaylists}
          />
        ) : (
          <VanityMetric
            metric={track_count}
            onPress={handlePressAccount}
            icon={IconNote}
          />
        )}
        <Divider orientation='vertical' style={styles.verticalDivider} />
        <VanityMetric
          metric={followee_count}
          onPress={handlePressFollowing}
          icon={IconUserList}
        />
        <Divider orientation='vertical' style={styles.verticalDivider} />
        <VanityMetric
          metric={follower_count}
          onPress={handlePressFollowers}
          icon={IconUserFollowers}
        />
      </View>
      <Divider style={styles.divider} />
    </>
  )
}
