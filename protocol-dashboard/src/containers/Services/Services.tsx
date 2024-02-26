import { Flex, IconEmbed } from '@audius/harmony'
import clsx from 'clsx'
import ContentTable from 'components/ContentTable'
import DiscoveryTable from 'components/DiscoveryTable'
import { ManageAccountCard } from 'components/ManageAccountCard/ManageAccountCard'
import ManageService from 'components/ManageService'
import Page from 'components/Page'
import { RegisterNodeCard } from 'components/RegisterNodeCard/RegisterNodeCard'
import { RewardsTimingCard } from 'components/RewardsTimingCard/RewardsTimingCard'
import TopOperatorsTable from 'components/TopOperatorsTable'
import React from 'react'
import { useAccount, useAccountUser } from 'store/account/hooks'
import { Status } from 'types'
import { createStyles } from 'utils/mobile'
import desktopStyles from './Services.module.css'
import mobileStyles from './ServicesMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'Nodes'
}

const NODE_LIMIT = 10

type OwnProps = {}

type ServicesProps = OwnProps

const Services: React.FC<ServicesProps> = () => {
  const { isLoggedIn } = useAccount()
  const { status: userStatus, user: accountUser } = useAccountUser()
  const isServiceProvider =
    userStatus === Status.Success && 'serviceProvider' in accountUser

  return (
    <Page title={messages.title} icon={IconEmbed} hidePreviousPage>
      <Flex direction="column" gap="l">
        {isLoggedIn && <ManageAccountCard />}
        {isServiceProvider ? <ManageService /> : <RegisterNodeCard />}
        <RewardsTimingCard />
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
      </Flex>
    </Page>
  )
}

export default Services
