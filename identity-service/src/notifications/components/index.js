import ReactDOMServer from 'react-dom/server'
import React from 'react'

import Head from './Head'
import Body from './Body'
/**
props = {
  title: 'What You Missed',
  unreadMessage: 'Unread Notifications from October 22nd 2019',
  notifications: [
    {
      type: 'Favorite',
      users: [
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' },
        { name: 'Choice', image: 'https://source.unsplash.com/random' }
      ],
      entity: {
        type: 'Track',
        name: 'Zeds Dead X DROELOE - Stars Tonight '
      }
    }, {
      type: 'Announcement',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.',
      hasReadMore: true
    }, {
      type: 'Repost',
      users: [ { name: 'Choice', image: 'https://source.unsplash.com/random' } ],
      entity: {
        type: 'Track',
        name: 'Zeds Dead X DROELOE - Stars Tonight '
      }
    }, {
      type: 'Follow',
      users: [ { name: 'Choice', image: 'https://source.unsplash.com/random' } ]
    }, {
      type: 'Milestone',
      achievment: 'Listen',
      value: 1000,
      entity: {
        type: 'Track',
        name: 'King Reserve'
      }
    }, {
      type: 'UserSubscription',
      users: [{ name: 'Choice', image: 'https://source.unsplash.com/random' }],
      entity: {
        count: 1,
        type: 'Track',
        name: 'King Reserve'
      }
    }
  ]
} */
const NotificationEmail = (props) => {
  return (
    <html>
      <Head title={props.title} />
      <Body {...props} />
    </html>
  )
}

const renderNotificationsEmail = (props) => {
  return ReactDOMServer.renderToString(<NotificationEmail {...props} />)
}

module.exports = renderNotificationsEmail
