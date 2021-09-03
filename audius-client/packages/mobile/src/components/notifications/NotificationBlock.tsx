import React, { useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native'
import { Notification, NotificationType } from '../../store/notifications/types'
import NotificationContent from './content/NotificationContent'
import IconHeart from '../../assets/images/iconHeart.svg'
import IconRepost from '../../assets/images/iconRepost.svg'
import IconStars from '../../assets/images/iconStars.svg'
import IconTrophy from '../../assets/images/iconTrophy.svg'
import IconUser from '../../assets/images/iconUser.svg'
import IconRemix from '../../assets/images/iconRemix.svg'
import IconTrending from '../../assets/images/iconTrending.svg'
import IconAudius from '../../assets/images/iconAudius.svg'
import { getNotificationRoute } from './routeUtil'
import { useColor, useTheme } from '../../utils/theme'

const IS_IOS = Platform.OS === 'ios'

const typeIconMap = {
  [NotificationType.Announcement]: IconAudius,
  [NotificationType.Follow]: IconUser,
  [NotificationType.UserSubscription]: IconStars,
  [NotificationType.Favorite]: IconHeart,
  [NotificationType.Repost]: IconRepost,
  [NotificationType.Milestone]: IconTrophy,
  [NotificationType.RemixCosign]: IconRemix,
  [NotificationType.RemixCreate]: IconRemix,
  [NotificationType.TrendingTrack]: IconTrending,
  [NotificationType.ChallengeReward]: IconAudius
}

const typeTitleMap = {
  [NotificationType.Announcement]: "WHAT'S NEW",
  [NotificationType.Follow]: 'NEW FOLLOWER',
  [NotificationType.UserSubscription]: 'ARTIST UPDATE',
  [NotificationType.Favorite]: 'NEW FAVORITES',
  [NotificationType.Repost]: 'NEW REPOSTS',
  [NotificationType.Milestone]: 'NEW MILESTONE',
  [NotificationType.RemixCosign]: 'NEW COSIGN',
  [NotificationType.RemixCreate]: 'NEW REMIX',
  [NotificationType.TrendingTrack]: 'TRENDING',
  [NotificationType.ChallengeReward]: "YOU'VE EARNED $AUDIO"
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
  const Icon = typeIconMap[notification.type]
  const title = typeTitleMap[notification.type]
  const notificationRoute = getNotificationRoute(notification)

  const onPress = useCallback(() => {
    onGoToRoute(notificationRoute)
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
            <Icon fill={notification.isViewed ? lowlight : highlight} />
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
            <View style={styles.content}>
              <NotificationContent
                notification={notification}
                onGoToRoute={onGoToRoute}
              />
            </View>
            <Text style={timestampStyles}>{notification.timeLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default NotificationBlock
