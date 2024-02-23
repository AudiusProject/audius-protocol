import React from 'react'

import Page from 'components/Page'
import Proposals from 'components/Proposals'

const messages = {
  title: 'All Governance Proposals'
}

type GovernanceProps = {}
const Governance: React.FC<GovernanceProps> = (props: GovernanceProps) => {
  return (
    <Page title={messages.title} hidePreviousPage>
      <Proposals />
    </Page>
  )
}

export default Governance
