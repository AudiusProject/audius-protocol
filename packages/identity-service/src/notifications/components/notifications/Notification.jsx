import React from 'react'
import { getRankSuffix } from '../../formatNotificationMetadata'

import NotificationBody from './NotificationBody'
import {
  WhiteHeavyCheckMarkIcon,
  IncomingEnvelopeIcon,
  HeadphoneIcon,
  MobilePhoneWithArrowIcon,
  MultipleMusicalNotesIcon,
  MoneyMouthFaceIcon,
  TrebleClefIcon
} from './Icons'

import { notificationTypes as NotificationType } from '../../constants'
import { capitalize } from '../../processNotifications/utils'

const challengeRewardsConfig = {
  rd: {
    title: 'Invite your Friends',
    icon: <IncomingEnvelopeIcon />
  },
  r: {
    title: 'Invite your Friends',
    icon: <IncomingEnvelopeIcon />
  },
  rv: {
    title: 'Invite your Fans',
    icon: <IncomingEnvelopeIcon />
  },
  v: {
    title: 'Link Verified Accounts',
    icon: <WhiteHeavyCheckMarkIcon />
  },
  l: {
    title: 'Listening Streak: 7 Days',
    icon: <HeadphoneIcon />
  },
  m: {
    title: 'Get the Audius Mobile App',
    icon: <MobilePhoneWithArrowIcon />
  },
  p: {
    title: 'Complete Your Profile',
    icon: <WhiteHeavyCheckMarkIcon />
  },
  u: {
    title: 'Upload 3 Tracks',
    icon: <MultipleMusicalNotesIcon />
  },
  ft: {
    title: 'Send Your First Tip',
    icon: <MoneyMouthFaceIcon />
  },
  fp: {
    title: 'Create a Playlist',
    icon: <TrebleClefIcon />
  }
}

const EntityType = Object.freeze({
  Track: 'Track',
  Album: 'Album',
  Playlist: 'Playlist'
})

const HighlightText = ({ text }) => (
  <span
    className={'avenir'}
    style={{
      color: '#7E1BCC',
      fontSize: '14px',
      fontWeight: '500'
    }}>
    {text}
  </span>
)

const BodyText = ({ text, className }) => (
  <span
    className={`avenir ${className}`}
    style={{
      color: '#858199',
      fontSize: '14px',
      fontWeight: '500'
    }}>
    {text}
  </span>
)

export const getUsers = (users) => {
  const [firstUser] = users
  if (users.length > 1) {
    const userCount = users.length - 1
    return (
      <>
        <HighlightText text={firstUser.name} />
        <BodyText
          text={` and ${userCount.toLocaleString()} other${
            users.length > 2 ? 's' : ''
          }`}
        />
      </>
    )
  }
  return <HighlightText text={firstUser.name} />
}

export const getEntity = (entity) => {
  if (entity.type === EntityType.Track) {
    return (
      <>
        {' '}
        <BodyText text={'track '} />
        <HighlightText text={entity.name} />{' '}
      </>
    )
  } else if (entity.type === EntityType.Album) {
    return (
      <>
        {' '}
        <BodyText text={'album '} />
        <HighlightText text={entity.name} />{' '}
      </>
    )
  } else if (entity.type === EntityType.Playlist) {
    return (
      <>
        {' '}
        <BodyText text={'playlist '} />
        <HighlightText text={entity.name} />{' '}
      </>
    )
  }
}

const notificationMap = {
  [NotificationType.Favorite.base](notification) {
    const user = getUsers(notification.users)
    const entity = getEntity(notification.entity)
    return (
      <span className={'notificationText'}>
        {user}
        <BodyText text={` favorited your `} />
        {entity}
      </span>
    )
  },
  [NotificationType.Repost.base](notification) {
    const user = getUsers(notification.users)
    const entity = getEntity(notification.entity)
    return (
      <span className={'notificationText'}>
        {user}
        <BodyText text={` reposted your `} />
        {entity}
      </span>
    )
  },
  [NotificationType.Follow](notification) {
    const user = getUsers(notification.users)
    return (
      <span className={'notificationText'}>
        {user}
        <BodyText text={` followed you`} />
      </span>
    )
  },
  [NotificationType.Announcement](notification) {
    return <BodyText className={'notificationText'} text={notification.text} />
  },
  [NotificationType.Milestone](notification) {
    if (notification.entity) {
      const entity = notification.entity.type.toLowerCase()
      const highlight = notification.entity.name
      const count = notification.value
      return (
        <span className={'notificationText'}>
          <BodyText text={`Your ${entity} `} />
          <HighlightText text={highlight} />
          <BodyText
            text={` has reached over ${count.toLocaleString()} ${
              notification.achievement
            }s`}
          />
        </span>
      )
    } else {
      return (
        <BodyText
          className={'notificationText'}
          text={`You have reached over ${notification.value} Followers `}
        />
      )
    }
  },
  [NotificationType.TrendingTrack](notification) {
    const highlight = notification.entity.title
    const rank = notification.rank
    const rankSuffix = getRankSuffix(rank)
    return (
      <span className={'notificationText'}>
        <BodyText text={`Your Track `} />
        <HighlightText text={highlight} />
        <BodyText text={` is ${rank}${rankSuffix} on Trending Right Now! 🍾`} />
      </span>
    )
  },
  [NotificationType.UserSubscription](notification) {
    const [user] = notification.users
    if (
      notification.entity.type === NotificationType.Track &&
      !isNaN(notification.entity.count) &&
      notification.entity.count > 1
    ) {
      return (
        <span className={'notificationText'}>
          <HighlightText text={user.name} />
          <BodyText
            text={` released ${notification.entity.count} new ${notification.entity.type}`}
          />
        </span>
      )
    }
    return (
      <span className={'notificationText'}>
        <HighlightText text={user.name} />
        <BodyText
          text={` released a new ${notification.entity.type} ${notification.entity.name}`}
        />
      </span>
    )
  },
  [NotificationType.RemixCreate](notification) {
    const { remixUser, remixTrack, parentTrackUser, parentTrack } = notification
    return (
      <span className={'notificationText'}>
        <HighlightText text={remixTrack.title} />
        <BodyText text={` by `} />
        <HighlightText text={remixUser.name} />
      </span>
    )
  },
  [NotificationType.RemixCosign](notification) {
    const { parentTrackUser, parentTracks } = notification
    const parentTrack = parentTracks.find(
      (t) => t.owner_id === parentTrackUser.user_id
    )
    return (
      <span className={'notificationText'}>
        <HighlightText text={parentTrackUser.name} />
        <BodyText text={` Co-signed your Remix of `} />
        <HighlightText text={parentTrack.title} />
      </span>
    )
  },
  [NotificationType.ChallengeReward](notification) {
    const { rewardAmount } = notification
    const { title, icon } = challengeRewardsConfig[notification.challengeId]
    let bodyText
    if (notification.challengeId === 'rd') {
      bodyText = `You’ve received ${rewardAmount} $AUDIO for being referred! Invite your friends to join to earn more!`
    } else {
      bodyText = `You’ve earned ${rewardAmount} $AUDIO for completing this challenge!`
    }
    return (
      <span className={'notificationText'}>
        <table cellspacing='0' cellpadding='0' style={{ marginBottom: '4px' }}>
          <tr>
            <td>{icon}</td>
            <td>
              <HighlightText text={title} />
            </td>
          </tr>
        </table>
        <BodyText text={bodyText} />
      </span>
    )
  },
  [NotificationType.AddTrackToPlaylist](notification) {
    return (
      <span className={'notificationText'}>
        <HighlightText text={notification.playlistOwner.name} />
        <BodyText text={` added your track `} />
        <HighlightText text={notification.track.title} />
        <BodyText text={` to their playlist `} />
        <HighlightText text={notification.playlist.playlist_name} />
      </span>
    )
  },
  [NotificationType.Reaction](notification) {
    return (
      <span className={'notificationText'}>
        <HighlightText text={capitalize(notification.reactingUser.name)} />
        <BodyText text={` reacted to your tip of `} />
        <HighlightText text={notification.amount} />
        <BodyText text={` $AUDIO`} />
      </span>
    )
  },
  [NotificationType.SupporterRankUp](notification) {
    return (
      <span className={'notificationText'}>
        <HighlightText text={capitalize(notification.sendingUser.name)} />
        <BodyText text={` became your `} />
        <HighlightText text={`#${notification.rank}`} />
        <BodyText text={` Top Supporter!`} />
      </span>
    )
  },
  [NotificationType.SupportingRankUp](notification) {
    return (
      <span className={'notificationText'}>
        <BodyText text={`You're now `} />
        <HighlightText text={capitalize(notification.receivingUser.name)} />
        <BodyText text={`'s `} />
        <HighlightText text={`#${notification.rank}`} />
        <BodyText text={` Top Supporter!`} />
      </span>
    )
  },
  [NotificationType.TipReceive](notification) {
    return (
      <span className={'notificationText'}>
        <HighlightText text={capitalize(notification.sendingUser.name)} />
        <BodyText text={` sent you a tip of `} />
        <HighlightText text={notification.amount} />
        <BodyText text={` $AUDIO`} />
      </span>
    )
  }
}

const getMessage = (notification) => {
  const getNotificationMessage = notificationMap[notification.type]
  if (!getNotificationMessage) return null
  return getNotificationMessage(notification)
}

const getTitle = (notification) => {
  switch (notification.type) {
    case NotificationType.RemixCreate: {
      const { parentTrack } = notification
      return (
        <span className={'notificationText'}>
          <BodyText text={`New remix of your track `} />
          <HighlightText text={parentTrack.title} />
        </span>
      )
    }
    default:
      return null
  }
}

const getTrackMessage = (notification) => {
  switch (notification.type) {
    case NotificationType.RemixCosign: {
      const { remixTrack } = notification
      return (
        <span className={'notificationText'}>
          <HighlightText text={remixTrack.title} />
        </span>
      )
    }
    default:
      return null
  }
}

export const getTrackLink = (track) => {
  return `https://audius.co/${track.route_id}-${track.track_id}`
}

const getTwitter = (notification) => {
  switch (notification.type) {
    case NotificationType.RemixCreate: {
      const { parentTrack, parentTrackUser, remixUser, remixTrack } =
        notification
      const twitterHandle = parentTrackUser.twitterHandle
        ? `@${parentTrackUser.twitterHandle}`
        : parentTrackUser.name
      const text = `New remix of ${parentTrack.title} by ${twitterHandle} on @audius #Audius`
      const url = getTrackLink(remixTrack)
      return {
        message: 'Share With Your Friends',
        href: `http://twitter.com/share?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`
      }
    }
    case NotificationType.RemixCosign: {
      const { parentTracks, parentTrackUser, remixTrack } = notification
      const parentTrack = parentTracks.find(
        (t) => t.owner_id === parentTrackUser.user_id
      )
      const url = getTrackLink(remixTrack)
      const twitterHandle = parentTrackUser.twitterHandle
        ? `@${parentTrackUser.twitterHandle}`
        : parentTrackUser.name
      const text = `My remix of ${parentTrack.title} was Co-Signed by ${twitterHandle} on @audius #Audius`
      return {
        message: 'Share With Your Friends',
        href: `http://twitter.com/share?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`
      }
    }
    case NotificationType.TrendingTrack: {
      const { rank, entity } = notification
      const url = getTrackLink(entity)
      const rankSuffix = getRankSuffix(rank)
      const text = `My track ${entity.title} is trending ${rank}${rankSuffix} on @audius! #AudiusTrending #Audius`
      return {
        message: 'Share this Milestone',
        href: `http://twitter.com/share?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(text)}`
      }
    }
    case NotificationType.ChallengeReward: {
      const text = `I earned $AUDIO for completing challenges on @audius #AudioRewards`
      return {
        message: 'Share this with your fans',
        href: `http://twitter.com/share?text=${encodeURIComponent(text)}`
      }
    }
    default:
      return null
  }
}

const Notification = (props) => {
  const message = getMessage(props)
  const title = getTitle(props)
  const trackMessage = getTrackMessage(props)
  const twitter = getTwitter(props)
  return (
    <NotificationBody
      {...props}
      title={title}
      message={message}
      trackMessage={trackMessage}
      twitter={twitter}
    />
  )
}

export default Notification
