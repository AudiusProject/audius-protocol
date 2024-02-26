import React from 'react'
import Page from 'components/Page'
import Proposals from 'components/Proposals'
import { IconUserGroup } from '@audius/harmony'

const messages = {
  title: 'Governance'
}

type GovernanceProps = {}
const Governance: React.FC<GovernanceProps> = (props: GovernanceProps) => {
  return (
    <Page icon={IconUserGroup} title={messages.title}>
      <Proposals />
    </Page>
  )
}

export default Governance
