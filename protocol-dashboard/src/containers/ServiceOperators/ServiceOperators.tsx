import React from 'react'

import Page from 'components/Page'
import TopOperatorsTable from 'components/TopOperatorsTable'

const messages = {
  title: 'ALL SERVICE OPERATORS'
}

type OwnProps = {}

type ServiceOperatorsProps = OwnProps
const ServiceOperators: React.FC<ServiceOperatorsProps> = () => {
  return (
    <Page title={messages.title}>
      <TopOperatorsTable />
    </Page>
  )
}

export default ServiceOperators
