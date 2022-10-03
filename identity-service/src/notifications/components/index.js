import ReactDOMServer from 'react-dom/server'
import React from 'react'

// ESLint has trouble understanding these imports
import Head from './Head' // eslint-disable-line
import Body from './Body' // eslint-disable-line

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
