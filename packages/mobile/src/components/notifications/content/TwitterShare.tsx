import React, { useCallback } from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import {
  Achievement,
  ChallengeReward,
  Entity,
  Notification,
  NotificationType,
  RemixCosign,
  RemixCreate,
  Track,
  TrendingTrack,
  User
} from '../../../store/notifications/types'
import IconTwitterBird from '../../../assets/images/iconTwitterBird.svg'
import { getEntityRoute } from '../routeUtil'
import { getUserRoute } from '../../../utils/routes'
import { getRankSuffix } from './Trending'

export const formatAchievementText = (
  type: string,
  name: string,
  value: number,
  achievement: string,
  link: string
) => {
  const achievementText =
    achievement === Achievement.Listens ? 'Plays' : achievement
  return `My ${type} ${name} has more than ${value} ${achievementText} on @AudiusProject #Audius 
Check it out!`
}

const getAchievementText = (notification: any) => {
  switch (notification.achievement) {
    case Achievement.Followers: {
      const link = getUserRoute(notification.user, true)
      const text = `I just hit over ${notification.value} followers on @AudiusProject #Audius!`
      return { text, link }
    }
    case Achievement.Favorites:
    case Achievement.Listens:
    case Achievement.Reposts: {
      const link = getEntityRoute(
        notification.entity,
        notification.entityType,
        true
      )
      const text = formatAchievementText(
        notification.entityType,
        notification.entity.title || notification.entity.playlist_name,
        notification.value,
        notification.achievement,
        link
      )
      return { text, link }
    }
    default: {
      return { text: '', link: '' }
    }
  }
}

const getTrendingTrackText = (notification: TrendingTrack) => {
  const link = getEntityRoute(
    notification.entity,
    notification.entityType,
    true
  )
  const text = `My track ${notification.entity.title} is trending ${
    notification.rank
  }${getRankSuffix(
    notification.rank
  )} on @AudiusProject! #AudiusTrending #Audius`
  return { link, text }
}

const getRemixCreateText = async (notification: RemixCreate) => {
  const track = notification.entities.find(
    (t: any) => t.track_id === notification.parentTrackId
  )
  if (!track) return
  const link = getEntityRoute(track, Entity.Track, true)

  let twitterHandle = notification.user.twitterHandle
  if (!twitterHandle) twitterHandle = notification.user.name
  else twitterHandle = `@${twitterHandle}`

  return {
    text: `New remix of ${track.title} by ${twitterHandle} on @AudiusProject #Audius`,
    link
  }
}

const getRemixCosignText = async (
  notification: RemixCosign & {
    user: User
    entities: (Track & { user: User })[]
  }
) => {
  const parentTrack = notification.entities.find(
    (t: Track) => t.owner_id === notification.parentTrackUserId
  )
  const childtrack = notification.entities.find(
    (t: Track) => t.track_id === notification.childTrackId
  )

  if (!parentTrack || !childtrack) return { text: '', link: '' }

  let twitterHandle = notification.user.twitterHandle
  if (!twitterHandle) twitterHandle = notification.user.name
  else twitterHandle = `@${twitterHandle}`

  const link = getEntityRoute(childtrack, Entity.Track)

  return {
    text: `My remix of ${parentTrack.title} was Co-Signed by ${twitterHandle} on @AudiusProject #Audius`,
    link
  }
}
export const getRewardsText = (notification: ChallengeReward) => ({
  text: `I earned $AUDIO for completing challenges on @AudiusProject #AudioRewards`,
  link: null
})

export const getNotificationTwitterText = async (notification: any) => {
  if (notification.type === NotificationType.Milestone) {
    return getAchievementText(notification)
  } else if (notification.type === NotificationType.TrendingTrack) {
    return getTrendingTrackText(notification)
  } else if (notification.type === NotificationType.RemixCreate) {
    return getRemixCreateText(notification)
  } else if (notification.type === NotificationType.RemixCosign) {
    return getRemixCosignText(notification)
  } else if (notification.type === NotificationType.ChallengeReward) {
    return getRewardsText(notification)
  }
}

export const getTwitterButtonText = (notification: any) => {
  switch (notification.type) {
    case NotificationType.TrendingTrack:
    case NotificationType.Milestone:
      return 'Share this Milestone'
    case NotificationType.RemixCreate:
    case NotificationType.RemixCosign:
    case NotificationType.ChallengeReward:
      return 'Share With Your Fans'
    default:
      return ''
  }
}

const getTwitterLink = (url: string | null, text: string) => {
  const textString = `?text=${encodeURIComponent(text)}`
  const urlString = url ? `&url=${encodeURIComponent(url)}` : ''

  return `http://twitter.com/share${textString}${urlString}`
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#1BA1F1',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 4
  },
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 4
  }
})

type TwitterShareProps = {
  notification: Notification
}

const TwitterShare = ({ notification }: TwitterShareProps) => {
  const buttonText = getTwitterButtonText(notification)
  const onPress = useCallback(async () => {
    const twitterText = await getNotificationTwitterText(notification)
    if (!twitterText) return
    const url = getTwitterLink(twitterText.link, twitterText.text)
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url)
      } else {
        console.error(`Can't open: ${url}`)
      }
    })
  }, [notification])

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <View style={styles.button}>
        <IconTwitterBird fill={'#FFFFFF'} />
        <Text style={styles.text}>{buttonText}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default TwitterShare
