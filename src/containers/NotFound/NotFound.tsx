import React from 'react'

import styles from './NotFound.module.css'
import Page from 'components/Page'

const messages = {
  title: 'Not Found'
}

type OwnProps = {}
type NotFoundProps = OwnProps

const NotFound: React.FC<NotFoundProps> = () => {
  return (
    <Page title={messages.title} className={styles.container}>
      <div>{'You look lost buddy, try going home :)'}</div>
    </Page>
  )
}

export default NotFound
