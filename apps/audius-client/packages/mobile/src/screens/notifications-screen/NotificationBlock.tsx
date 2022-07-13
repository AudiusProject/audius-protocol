import { useCallback, useContext } from 'react'

import { BadgeTier } from 'audius-client/src/common/models/BadgeTier'
import {
  getNotificationEntities,
  getNotificationEntity,
  getNotificationUser,
  getNotificationUsers
} from 'audius-client/src/common/store/notifications/selectors'
import {
  Notification,
  NotificationType,
  TierChange
} from 'audius-client/src/common/store/notifications/types'
import { setNotificationId } from 'audius-client/src/common/store/user-list/notifications/actions'
import { NOTIFICATION_PAGE } from 'audius-client/src/utils/route'
import { View, Text } from 'react-native'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'
import IconAudius from 'app/assets/images/iconAudius.svg'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconPlaylists from 'app/assets/images/iconPlaylists.svg'
import IconRemix from 'app/assets/images/iconRemix.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import IconStars from 'app/assets/images/iconStars.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { Tile } from 'app/components/core'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { isEqual, useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { AppTabScreenParamList } from 'app/screens/app-screen'
import { ProfileTabScreenParamList } from 'app/screens/app-screen/ProfileTabScreen'
import { NotificationsDrawerNavigationContext } from 'app/screens/notifications-screen/NotificationsDrawerNavigationContext'
import { close } from 'app/store/notifications/actions'
import { makeStyles } from 'app/styles'

import NotificationContent from './content/NotificationContent'
import { getNotificationRoute, getNotificationScreen } from './routeUtil'

// The maximum number of users to fetch along with a notification,
// which determines the number of profile pictures to show
const USER_LENGTH_LIMIT = 8

const tierInfoMap: Record<
  BadgeTier,
  { title: string; icon: React.FC<SvgProps> }
> = {
  none: {
    title: 'NO TIER',
    icon: IconBronzeBadge
  },
  bronze: {
    title: 'BRONZE TIER UNLOCKED',
    icon: IconBronzeBadge
  },
  silver: {
    title: 'SILVER TIER UNLOCKED',
    icon: IconSilverBadge
  },
  gold: {
    title: 'GOLD TIER UNLOCKED',
    icon: IconGoldBadge
  },
  platinum: {
    title: 'PLATINUM TIER UNLOCKED',
    icon: IconPlatinumBadge
  }
}

const typeIconMap: Record<
  NotificationType,
  (notification: any) => React.FC<SvgProps>
> = {
  [NotificationType.Announcement]: () => IconAudius,
  [NotificationType.Follow]: () => IconUser,
  [NotificationType.UserSubscription]: () => IconStars,
  [NotificationType.Favorite]: () => IconHeart,
  [NotificationType.Repost]: () => IconRepost,
  [NotificationType.Milestone]: () => IconTrophy,
  [NotificationType.RemixCosign]: () => IconRemix,
  [NotificationType.RemixCreate]: () => IconRemix,
  [NotificationType.TrendingTrack]: () => IconTrending,
  [NotificationType.ChallengeReward]: () => IconAudius,
  [NotificationType.TierChange]: (notification: TierChange) =>
    tierInfoMap[notification.tier].icon,
  [NotificationType.Reaction]: () => IconTrending,
  [NotificationType.TipReceive]: () => IconTrending,
  [NotificationType.TipSend]: () => IconTrending,
  [NotificationType.SupporterRankUp]: () => IconTrending,
  [NotificationType.SupportingRankUp]: () => IconTrending,
  [NotificationType.AddTrackToPlaylist]: () => IconPlaylists
}

const typeTitleMap: Record<NotificationType, (notification: any) => string> = {
  [NotificationType.Announcement]: () => "WHAT'S NEW",
  [NotificationType.Follow]: () => 'NEW FOLLOWER',
  [NotificationType.UserSubscription]: () => 'ARTIST UPDATE',
  [NotificationType.Favorite]: () => 'NEW FAVORITES',
  [NotificationType.Repost]: () => 'NEW REPOSTS',
  [NotificationType.Milestone]: () => 'NEW MILESTONE',
  [NotificationType.RemixCosign]: () => 'NEW COSIGN',
  [NotificationType.RemixCreate]: () => 'NEW REMIX',
  [NotificationType.TrendingTrack]: () => 'TRENDING',
  [NotificationType.ChallengeReward]: () => "YOU'VE EARNED $AUDIO",
  [NotificationType.TierChange]: (notification: TierChange) =>
    tierInfoMap[notification.tier].title,
  [NotificationType.Reaction]: () => '',
  [NotificationType.TipReceive]: () => '',
  [NotificationType.TipSend]: () => '',
  [NotificationType.SupporterRankUp]: () => '',
  [NotificationType.SupportingRankUp]: () => '',
  [NotificationType.AddTrackToPlaylist]: () => 'TRACK ADDED TO PLAYLIST'
}

const useStyles = makeStyles(({ spacing, palette }, { isViewed }) => ({
  tile: {
    borderColor: isViewed ? 'none' : palette.primary,
    borderWidth: isViewed ? 0 : 2
  },
  content: {
    padding: spacing(3),
    paddingVertical: spacing(4)
  },
  top: {
    flexDirection: 'row',
    marginLeft: spacing(3),
    justifyContent: 'flex-start',
    alignItems: 'center',
    lineHeight: 20,
    marginBottom: spacing(2)
  },
  title: {
    fontFamily: 'AvenirNextLTPro-Heavy',
    fontSize: 18,
    marginLeft: 12,
    color: isViewed ? palette.neutralLight4 : palette.primary
  },
  body: {
    marginLeft: spacing(12)
  },
  timestamp: {
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 12,
    marginTop: spacing(2),
    color: palette.neutralLight5
  },
  iconTierChange: {
    color: isViewed ? palette.neutralLight4 : palette.primary
  }
}))

type NotificationBlockProps = {
  notification: Notification
}

export const NotificationBlock = (props: NotificationBlockProps) => {
  const { notification } = props
  const { isViewed, type } = notification
  const styles = useStyles({ isViewed })
  const Icon = typeIconMap[type](notification)
  const title = typeTitleMap[type](notification)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

  const user = useSelectorWeb((state) =>
    getNotificationUser(state, notification)
  )

  const users = useSelectorWeb(
    (state) => getNotificationUsers(state, notification, USER_LENGTH_LIMIT),
    isEqual
  )

  const entity = useSelectorWeb(
    (state) => getNotificationEntity(state, notification),
    isEqual
  )

  const entities = useSelectorWeb(
    (state) => getNotificationEntities(state, notification),
    isEqual
  )

  // TODO: Type notifications & their selectors more strictly.
  // The reason we ignore here is because user/users/entity/entities
  // are specific to each type of notification, but they are handled by
  // generic selectors.
  // @ts-ignore
  notification.user = user
  // @ts-ignore
  notification.users = users
  // @ts-ignore
  notification.entity = entity
  // @ts-ignore
  notification.entities = entities

  const notificationScreen = getNotificationScreen(notification, {
    fromNotifications: true
  })
  const notificationRoute = getNotificationRoute(notification)
  const { drawerHelpers } = useContext(NotificationsDrawerNavigationContext)
  const navigation = useNavigation<
    AppTabScreenParamList & ProfileTabScreenParamList
  >({ customNativeNavigation: drawerHelpers })

  const onPress = useCallback(() => {
    if (notificationRoute && notificationScreen) {
      if (notificationScreen.screen === 'NotificationUsers') {
        dispatchWeb(setNotificationId(notification.id))
      }
      navigation.navigate({
        native: notificationScreen,
        web: {
          route: notificationRoute,
          fromPage: NOTIFICATION_PAGE
        }
      })
      dispatch(close())
    }
  }, [
    notification,
    notificationScreen,
    notificationRoute,
    navigation,
    dispatch,
    dispatchWeb
  ])

  const iconHeightProps =
    notification.type === NotificationType.TierChange
      ? { height: 32, width: 32 }
      : {}

  return (
    <Tile
      onPress={onPress}
      styles={{ tile: styles.tile, content: styles.content }}>
      <View style={styles.top}>
        <Icon {...iconHeightProps} fill={styles.iconTierChange.color} />
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.body}>
        <NotificationContent notification={notification} />
        <Text style={styles.timestamp}>{notification.timeLabel}</Text>
      </View>
    </Tile>
  )
}
