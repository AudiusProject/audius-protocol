import { useCallback, useRef } from 'react'
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
  const discoveryTableRef = useRef(null)
  const contentTableRef = useRef(null)
  const handleClickDiscoveryTable = useCallback(() => {
    window.scrollTo({
      top: discoveryTableRef.current?.offsetTop,
      behavior: 'smooth'
    })
  }, [])
  const handleClickContentTable = useCallback(() => {
    window.scrollTo({
      top: contentTableRef.current?.offsetTop,
      behavior: 'smooth'
    })
  }, [])

  const isServiceProvider =
    userStatus === Status.Success && 'serviceProvider' in accountUser

  return (
    <Page title={messages.title} icon={IconEmbed}>
      <Flex direction="column" gap="l">
        {isLoggedIn && accountUser ? (
          <ManageAccountCard wallet={accountUser?.wallet} />
        ) : null}
        {isServiceProvider ? (
          <ManageService
            wallet={accountUser?.wallet}
            showPendingTransactions
            onClickDiscoveryTable={
              discoveryTableRef?.current ? handleClickDiscoveryTable : undefined
            }
            onClickContentTable={
              contentTableRef?.current ? handleClickContentTable : undefined
            }
          />
        ) : (
          <RegisterNodeCard />
        )}
        <RewardsTimingCard />
        <TopOperatorsTable
          limit={5}
          className={styles.topAddressesTable}
          alwaysShowMore
        />
        <div className={styles.serviceContainer}>
          <div ref={discoveryTableRef}>
            <DiscoveryTable
              className={clsx(styles.serviceTable, styles.rightSpacing)}
              limit={NODE_LIMIT}
              alwaysShowMore
            />
          </div>
          <div ref={contentTableRef}>
            <ContentTable
              className={clsx(styles.serviceTable, styles.leftSpacing)}
              limit={NODE_LIMIT}
              alwaysShowMore
            />
          </div>
        </div>
      </Flex>
    </Page>
  )
}

export default Services
