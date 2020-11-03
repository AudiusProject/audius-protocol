import React from 'react'

import styles from './ContentNodes.module.css'
import Page from 'components/Page'
import ContentTable from 'components/ContentTable'
import { SERVICES_TITLE, SERVICES } from 'utils/routes'

const messages = {
  title: 'Content Nodes'
}

type OwnProps = {}
type ContentNodesProps = OwnProps

const ContentNodes: React.FC<ContentNodesProps> = () => {
  return (
    <Page
      title={messages.title}
      className={styles.container}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      <ContentTable className={styles.serviceTable} />
    </Page>
  )
}

export default ContentNodes
