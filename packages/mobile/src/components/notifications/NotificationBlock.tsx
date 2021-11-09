import React, { useCallback } from 'react'

import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native'
import { SvgProps } from 'react-native-svg'

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
import {
  Notification,
  NotificationType,
  TierChange
} from 'app/store/notifications/types'
import { BadgeTier } from 'app/utils/badgeTier'
import { useColor, useTheme } from 'app/utils/theme'

import NotificationContent from './content/NotificationContent'
import { getNotificationRoute } from './routeUtil'

const IS_IOS = Platform.OS === 'ios'

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
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1.0,
    elevation: 1,
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
  onGoToRoute: (route: string) => void
}

const NotificationBlock = ({
  notification,
  onGoToRoute
}: NotificationBlockProps) => {
  const Icon = typeIconMap[notification.type](notification)
  const title = typeTitleMap[notification.type](notification)
  const notificationRoute = getNotificationRoute(notification)

  const onPress = useCallback(() => {
    if (notificationRoute) {
      onGoToRoute(notificationRoute)
    }
  }, [onGoToRoute, notificationRoute])

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
            <NotificationContent
              notification={notification}
              onGoToRoute={onGoToRoute}
            />
            <Text style={timestampStyles}>{notification.timeLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default NotificationBlock
