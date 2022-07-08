import React from 'react'

import Footer from './Footer'
import Notification from './notifications/Notification'
import { notificationTypes as NotificationType } from '../constants'

const AudiusImage = () => {
  return (
    <img
      src='https://gallery.mailchimp.com/f351897a27ff0a641b8acd9ab/images/b1070e55-9487-4acb-abce-e755484cce46.png'
      style={{ maxWidth: '240px', margin: '27px auto' }}
      alt='Audius Logo'
    />
  )
}

const WhatYouMissed = () => {
  return (
    <img
      src='https://download.audius.co/static-resources/email/whatYouMissed.png'
      style={{
        maxWidth: '490px',
        margin: '0px auto 7px'
      }}
      alt='What You Missed'
    />
  )
}

const UnreadNotifications = ({ message }) => (
  <p className={'avenir'}
    style={{
      color: 'rgba(133,129,153,0.5)',
      fontSize: '16px',
      fontWeight: 500,
      letterSpacing: '0.02px',
      textAlign: 'center',
      margin: '0px auto 24px'
    }}>
    {message}
  </p>
)

const getNumberSuffix = (num) => {
  if (num === 1) return 'st'
  else if (num === 2) return 'nd'
  else if (num === 3) return 'rd'
  return 'th'
}

const snippetMap = {
  [NotificationType.Favorite.base] (notification) {
    const [user] = notification.users
    return `${user.name} favorited your ${notification.entity.type.toLowerCase()} ${notification.entity.name}`
  },
  [NotificationType.Repost.base] (notification) {
    const [user] = notification.users
    return `${user.name} reposted your ${notification.entity.type.toLowerCase()} ${notification.entity.name}`
  },
  [NotificationType.Follow] (notification) {
    const [user] = notification.users
    return `${user.name} followed you`
  },
  [NotificationType.Announcement] (notification) {
    return notification.text
  },
  [NotificationType.Milestone] (notification) {
    if (notification.entity) {
      const entity = notification.entity.type.toLowerCase()
      return `Your ${entity} ${notification.entity.name} has reached over ${notification.value} ${notification.achievement}s`
    } else {
      return `You have reached over ${notification.value} Followers`
    }
  },
  [NotificationType.TrendingTrack] (notification) {
    const rank = notification.rank
    const suffix = getNumberSuffix(rank)
    return `Your Track ${notification.entity.title} is ${notification.rank}${suffix} on Trending Right Now!`
  },
  [NotificationType.UserSubscription] (notification) {
    const [user] = notification.users
    if (notification.entity.type === NotificationType.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
      return `${user.name} released ${notification.entity.count} new ${notification.entity.type}`
    }
    return `${user.name} released a new ${notification.entity.type.toLowerCase()} ${notification.entity.name}`
  },
  [NotificationType.RemixCreate] (notification) {
    const { parentTrack } = notification
    return `New remix of your track ${parentTrack.title}`
  },
  [NotificationType.RemixCosign] (notification) {
    const { parentTrackUser, parentTracks } = notification
    const parentTrack = parentTracks.find(t => t.ownerId === parentTrackUser.userId)
    return `${parentTrackUser.name} Co-signed your Remix of ${parentTrack.title}`
  },
  [NotificationType.ChallengeReward] (notification) {
    return `You've earned $AUDIO for completing challenges`
  },
  [NotificationType.AddTrackToPlaylist] (notification) {
    return `${notification.playlistOwner.name} added ${notification.track.title} to ${notification.playlist.playlist_name}`
  },
  [NotificationType.TipReceive] (notification) {
    return `${notification.sendingUser.name} sent you a tip of ${notification.amount} $AUDIO`
  },
  [NotificationType.Reaction] (notification) {
    return `${notification.reactingUser.name} reacted to your tip of ${notification.amount} $AUDIO`
  },
  [NotificationType.SupporterRankUp] (notification) {
    return `${notification.sendingUser.name} became your #${notification.rank} top supporter`
  },
  [NotificationType.SupportingRankUp] (notification) {
    return `You're now ${notification.receivingUser.name}'s #${notification.rank} top supporter`
  }
}

const mapNotification = (notification) => {
  switch (notification.type) {
    case NotificationType.RemixCreate: {
      notification.users = [notification.remixUser]
      return notification
    }
    case NotificationType.RemixCosign: {
      notification.track = notification.remixTrack
      return notification
    }
    default: {
      return notification
    }
  }
}

// Generate snippet for email composed of the first three notification texts,
// but limited to 90 characters w/ an ellipsis
const SNIPPET_ELLIPSIS_LENGTH = 90
const getSnippet = (notifications) => {
  const snippet = notifications.slice(0, 3).map(notification => {
    console.log(`CONSOLE LOG notification ${notification} snippetMap[notification.type] ${snippetMap[notification.type]}`)
    return snippetMap[notification.type](notification)
  }).join(', ')
  if (snippet.length <= SNIPPET_ELLIPSIS_LENGTH) return snippet
  const indexOfEllipsis = snippet.substring(SNIPPET_ELLIPSIS_LENGTH).indexOf(' ') + SNIPPET_ELLIPSIS_LENGTH
  return `${snippet.substring(0, indexOfEllipsis)} ...`
}

const Body = (props) => {
  return (
    <body bgcolor='#FFFFFF' style={{ backgroundColor: '#FFFFFF' }}>
      <p
        style={{
          display: 'none',
          fontSize: '1px',
          color: '#333333',
          lineHeight: '1px',
          maxHeight: '0px',
          maxWidth: '0px',
          opacity: 0,
          overflow: 'hidden'
        }}
        dangerouslySetInnerHTML={{ __html: `${getSnippet(props.notifications)}
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        <wbr>
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        <wbr>
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        <wbr>
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        <wbr>
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        <wbr>
        &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        ` }}
      />
      <center>
        <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' id='bodyTable' bgcolor='#FFFFFF' style={{ backgroundColor: '#FFFFFF' }}>
          <tr>
            <td align='center' valign='top' id='bodyCell'>
              <AudiusImage />
            </td>
          </tr>
          <tr>
            <td align='center' valign='top' id='bodyCell'>
              <WhatYouMissed />
            </td>
          </tr>
          <tr>
            <td align='center' valign='top' id='bodyCell'>
              <UnreadNotifications message={props.subject} />
            </td>
          </tr>
          <tr>
            <td
              align='center'
              valign='top'
              id='bodyCell'
              style={{
                borderRadius: '4px',
                maxWidth: '396px',
                marginBottom: '32px'
              }}
            >
              {props.notifications.map((notification, ind) => (
                <Notification key={ind} {...mapNotification(notification)} />
              ))}
            </td>
          </tr>
          <tr>
            <td align='center' valign='top' id='bodyCell' style={{ padding: '24px 0px 32px', width: '100%' }}>
              <table
                cellspacing='0'
                cellpadding='0'
                style={{ margin: '0px auto' }}
              >
                <tr>
                  <td style={{ borderRadius: '17px', margin: '0px auto' }} bgcolor='#7E1BCC'>
                    <a
                      href='https://audius.co/feed?openNotifications=true'
                      target='_blank'
                      style={{
                        padding: '8px 24px',
                        fontSize: '14px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}
                    >
                              See more on Audius
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '25px' }}>
              <Footer copyrightYear={props.copyrightYear} />
            </td>
          </tr>
        </table>
      </center>
    </body>
  )
}

export default Body
