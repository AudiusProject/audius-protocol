import React from 'react'

import styles from './CreatorNodes.module.css'
import Page from 'components/Page'
import CreatorTable from 'components/CreatorTable'
import { SERVICES_TITLE, SERVICES } from 'utils/routes'

const messages = {
  title: 'Creator Nodes'
}

type OwnProps = {}
type CreatorNodesProps = OwnProps

const CreatorNodes: React.FC<CreatorNodesProps> = () => {
  return (
    <Page
      title={messages.title}
      className={styles.container}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      <CreatorTable className={styles.serviceTable} />
    </Page>
  )
}

export default CreatorNodes
