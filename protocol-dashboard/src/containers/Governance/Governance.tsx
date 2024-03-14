import React from 'react'
import Page from 'components/Page'
import Proposals from 'components/Proposals'
import IconGavel from 'assets/img/iconGavel.svg?react'

const messages = {
  title: 'Governance'
}

type GovernanceProps = {}
const Governance: React.FC<GovernanceProps> = (props: GovernanceProps) => {
  return (
    <Page icon={IconGavel} title={messages.title}>
      <Proposals />
    </Page>
  )
}

export default Governance
