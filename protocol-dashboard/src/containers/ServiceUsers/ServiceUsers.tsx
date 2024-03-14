import React from 'react'

import Page from 'components/Page'
import TopAddressesTable from 'components/TopAddressesTable'

const messages = {
  title: 'ALL USERS'
}

type OwnProps = {}

type ServiceUsersProps = OwnProps
const ServiceUsers: React.FC<ServiceUsersProps> = () => {
  return (
    <Page title={messages.title}>
      <TopAddressesTable />
    </Page>
  )
}

export default ServiceUsers
