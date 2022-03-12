import { useCallback } from 'react'

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
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native'
import { Shadow } from 'react-native-shadow-2'
import { SvgProps } from 'react-native-svg'
import { useDispatch } from 'react-redux'

import IconBronzeBadge from 'app/assets/images/IconBronzeBadge.svg'
import IconGoldBadge from 'app/assets/images/IconGoldBadge.svg'
import IconPlatinumBadge from 'app/assets/images/IconPlatinumBadge.svg'
import IconSilverBadge from 'app/assets/images/IconSilverBadge.svg'
import IconAudius from 'app/assets/images/iconAudius.svg'
import IconHeart from 'app/assets/images/iconHeart.svg'
import IconRemix from 'app/assets/images/iconRemix.svg'
import IconRepost from 'app/assets/images/iconRepost.svg'
import IconStars from 'app/assets/images/iconStars.svg'
import IconTrending from 'app/assets/images/iconTrending.svg'
import IconTrophy from 'app/assets/images/iconTrophy.svg'
import IconUser from 'app/assets/images/iconUser.svg'
import { AudioTier } from 'app/components/audio-rewards'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useNavigation } from 'app/hooks/useNavigation'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { close } from 'app/store/notifications/actions'
import { useColor, useTheme } from 'app/utils/theme'

import NotificationContent from './content/NotificationContent'
import { getNotificationRoute, getNotificationScreen } from './routeUtil'

// The maximum number of users to fetch along with a notification,
// which determines the number of profile pictures to show
const USER_LENGTH_LIMIT = 8

const IS_IOS = Platform.OS === 'ios'

const tierInfoMap: Record<
  AudioTier,
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
    tierInfoMap[notification.tier].icon
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
    tierInfoMap[notification.tier].title
}

const styles = StyleSheet.create({
  item: {
    borderRadius: 8,
    padding: 12,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  top: {
    flexDirection: 'row',
    marginLeft: 12,
    justifyContent: 'flex-start',
    alignItems: 'center',
    lineHeight: 20,
    marginBottom: 8
  },
  title: {
    fontFamily: 'AvenirNextLTPro-Heavy',
    fontSize: 18,
    marginLeft: 12
  },
  body: {
    marginLeft: 46
  },
  timestamp: {
    fontFamily: 'AvenirNextLTPro-Regular',
    fontSize: 12,
    marginTop: 8
  }
})

type NotificationBlockProps = {
  notification: Notification
}

const NotificationBlock = ({ notification }: NotificationBlockProps) => {
  const Icon = typeIconMap[notification.type](notification)
  const title = typeTitleMap[notification.type](notification)
  const dispatch = useDispatch()
  const dispatchWeb = useDispatchWeb()

  const user = useSelectorWeb(state => getNotificationUser(state, notification))
  const users = useSelectorWeb(state =>
    getNotificationUsers(state, notification, USER_LENGTH_LIMIT)
  )
  const entity = useSelectorWeb(state =>
    getNotificationEntity(state, notification)
  )
  const entities = useSelectorWeb(state =>
    getNotificationEntities(state, notification)
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

  const notificationScreen = getNotificationScreen(notification)
  const notificationRoute = getNotificationRoute(notification)
  const navigation = useNavigation()

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

  const itemStyles = useTheme(styles.item, {
    backgroundColor: 'white',
    shadowColor: 'shadow'
  })
  const timestampStyles = useTheme(styles.timestamp, {
    color: 'neutralLight5'
  })
  const highlight = useColor('primary')
  const lowlight = useColor('neutralLight4')

  const animation = new Animated.Value(0)
  const inputRange = [0, 1]
  const outputRange = [1, 0.97]
  const scale = animation.interpolate({ inputRange, outputRange })

  const onPressIn = () => {
    Animated.spring(animation, {
      toValue: 1,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
  }
  const onPressOut = () => {
    Animated.spring(animation, {
      toValue: 0,
      tension: 150,
      friction: 25,
      useNativeDriver: true
    }).start()
  }

  const iconProps =
    notification.type === NotificationType.TierChange
      ? { height: 32, width: 32 }
      : {}

  return (
    <Animated.View style={[{ transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={notificationRoute ? onPress : undefined}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        delayPressIn={50}
        activeOpacity={notificationRoute && IS_IOS ? 0.8 : 1}
      >
        <Shadow
          offset={[2, 2]}
          viewStyle={{ alignSelf: 'stretch' }}
          distance={5}
          startColor='#0000000F'
        >
          <View
            style={[
              itemStyles,
              {
                borderColor: notification.isViewed ? 'none' : highlight,
                borderWidth: notification.isViewed ? 0 : 2
              }
            ]}
          >
            <View style={styles.top}>
              <Icon
                {...iconProps}
                fill={notification.isViewed ? lowlight : highlight}
              />
              <Text
                style={[
                  styles.title,
                  {
                    color: notification.isViewed ? lowlight : highlight
                  }
                ]}
              >
                {title}
              </Text>
            </View>
            <View style={styles.body}>
              <NotificationContent notification={notification} />
              <Text style={timestampStyles}>{notification.timeLabel}</Text>
            </View>
          </View>
        </Shadow>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default NotificationBlock
