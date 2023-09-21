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

type Props = {
  title: string
  notifications: any[]
  subject: string
  copyrightYear: string
}

export const renderNotificationsEmail = (props: Props) => {
  return ReactDOMServer.renderToString(<NotificationEmail {...props} />)
}
