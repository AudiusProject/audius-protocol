import ReactDOMServer from 'react-dom/server'
import React from 'react'

import Head from './Head'
import Body from './Body'
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
