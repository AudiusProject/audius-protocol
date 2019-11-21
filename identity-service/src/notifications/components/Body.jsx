import React from 'react'

import Footer from './Footer'
import Notification, {
  NotificationType,
  getUsers,
  getEntity
} from './notifications/Notification'

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

const snippetMap = {
  [NotificationType.Favorite] (notification) {
    const [user] = notification.users
    return `${user.name} favorited your ${notification.entity.name}`
  },
  [NotificationType.Repost] (notification) {
    const [user] = notification.users
    return `${user.name} reposted your ${notification.entity.name}`
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
      return `Your have reached over ${notification.value} Followers `
    }
  },
  [NotificationType.UserSubscription] (notification) {
    const [user] = notification.users
    if (notification.entity.type === NotificationType.Track && !isNaN(notification.entity.count) && notification.entity.count > 1) {
      return `${user.name} released ${notification.entity.count} new ${notification.entity.type}`
    }
    return `${user.name} released a new ${notification.entity.type}  ${notification.entity.name}`
  }
}

const getSnippet = (notification) => {
  return snippetMap[notification.type](notification)
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
        dangerouslySetInnerHTML={{ __html: `${getSnippet(props.notifications[0])}
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
                <Notification key={ind} {...notification} />
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
                      href='https://audius.co'
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
              <Footer />
            </td>
          </tr>
        </table>
      </center>
    </body>
  )
}

export default Body
