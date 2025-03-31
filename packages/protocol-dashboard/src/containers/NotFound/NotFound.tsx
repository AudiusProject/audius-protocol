import React from 'react'

import Page from 'components/Page'

import styles from './NotFound.module.css'

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
