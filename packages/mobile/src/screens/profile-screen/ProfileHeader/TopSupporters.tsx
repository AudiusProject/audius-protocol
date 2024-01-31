import { useCallback, useEffect } from 'react'

import { useProxySelector } from '@audius/common/hooks'
import {
  cacheUsersSelectors,
  tippingSelectors,
  tippingActions
} from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'

import { IconCaretRight, IconTrophy } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { ProfilePictureList } from 'app/screens/notifications-screen/Notification'
import { ProfilePictureListSkeleton } from 'app/screens/notifications-screen/Notification/ProfilePictureListSkeleton'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'
const { getOptimisticSupportersForUser } = tippingSelectors
const { fetchSupportersForUser } = tippingActions
const { getUsers } = cacheUsersSelectors

const messages = {
  topSupporters: 'Top Supporters',
  buttonTitle: 'View'
}

const MAX_PROFILE_SUPPORTERS_VIEW_ALL_USERS = 6

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  root: {
    marginVertical: spacing(2),
    paddingTop: spacing(2),
    alignItems: 'center'
  },
  touchableRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profilePictureList: {
    marginRight: spacing(6)
  },
  profilePicture: {
    width: 28,
    height: 28
  },
  alignRowCenter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    marginRight: spacing(2)
  },
  viewTopSupportersText: {
    marginRight: spacing(4),
    color: palette.neutral,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold
  },
  viewTopSupportersButtonText: {
    color: palette.secondary,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.bold
  }
}))

const useSelectTopSupporters = (userId: number) =>
  useProxySelector(
    (state) => {
      const supporters = getOptimisticSupportersForUser(state, userId)
      if (!supporters) return []

      const topSupporterIds = Object.keys(supporters)
        .sort((id1, id2) => supporters[id1].rank - supporters[id2].rank)
        .map((id) => supporters[id])
        .map((supporter) => supporter.sender_id)

      const supporterUsers = getUsers(state, { ids: topSupporterIds })

      const topSupporters = topSupporterIds
        .map((id) => supporterUsers[id])
        .filter(removeNullable)
      return topSupporters
    },
    [userId]
  )

export const TopSupporters = () => {
  const styles = useStyles()
  const { secondary, neutral } = useThemeColors()
  const navigation = useNavigation()
  const { user_id, supporter_count } = useSelectProfile([
    'user_id',
    'supporter_count'
  ])

  const dispatch = useDispatch()

  const shouldFetchSupporters = useSelector((state) => {
    return (
      !state.tipping.supporters[user_id] &&
      !state.tipping.supportersOverrides[user_id]
    )
  })

  useEffect(() => {
    if (supporter_count > 0 && shouldFetchSupporters) {
      dispatch(fetchSupportersForUser({ userId: user_id }))
    }
  }, [supporter_count, shouldFetchSupporters, dispatch, user_id])

  const topSupporters = useSelectTopSupporters(user_id)

  const handlePress = useCallback(() => {
    navigation.push('TopSupporters', { userId: user_id, source: 'profile' })
  }, [navigation, user_id])

  return supporter_count ? (
    <View style={styles.root} pointerEvents='box-none'>
      <TouchableOpacity style={styles.touchableRoot} onPress={handlePress}>
        {topSupporters.length > 0 ? (
          <ProfilePictureList
            users={topSupporters}
            totalUserCount={supporter_count}
            limit={MAX_PROFILE_SUPPORTERS_VIEW_ALL_USERS}
            style={styles.profilePictureList}
            navigationType='push'
            interactive={false}
            imageStyles={styles.profilePicture}
          />
        ) : (
          <ProfilePictureListSkeleton
            count={supporter_count}
            limit={MAX_PROFILE_SUPPORTERS_VIEW_ALL_USERS}
          />
        )}
        <View style={styles.alignRowCenter}>
          <IconTrophy style={styles.icon} fill={neutral} />
          <Text style={styles.viewTopSupportersText}>
            {messages.topSupporters}
          </Text>
          <Text style={styles.viewTopSupportersButtonText}>
            {messages.buttonTitle}
          </Text>
          <IconCaretRight fill={secondary} width={14} height={14} />
        </View>
      </TouchableOpacity>
    </View>
  ) : null
}
