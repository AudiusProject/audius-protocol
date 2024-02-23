import React from 'react'

import clsx from 'clsx'

import ContentTable from 'components/ContentTable'
import DiscoveryTable from 'components/DiscoveryTable'
import ManageService from 'components/ManageService'
import Page from 'components/Page'
import TopOperatorsTable from 'components/TopOperatorsTable'
import { useAccount } from 'store/account/hooks'
import { createStyles } from 'utils/mobile'

import desktopStyles from './Services.module.css'
import mobileStyles from './ServicesMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'SERVICES OVERVIEW'
}

const NODE_LIMIT = 10

type OwnProps = {}

type ServicesProps = OwnProps

const Services: React.FC<ServicesProps> = () => {
  const { isLoggedIn } = useAccount()
  return (
    <Page title={messages.title} hidePreviousPage>
      {isLoggedIn && <ManageService />}
      <TopOperatorsTable
        limit={5}
        className={styles.topAddressesTable}
        alwaysShowMore
      />
      <div className={styles.serviceContainer}>
        <DiscoveryTable
          className={clsx(styles.serviceTable, styles.rightSpacing)}
          limit={NODE_LIMIT}
          alwaysShowMore
        />
        <ContentTable
          className={clsx(styles.serviceTable, styles.leftSpacing)}
          limit={NODE_LIMIT}
          alwaysShowMore
        />
      </div>
    </Page>
  )
}

export default Services
