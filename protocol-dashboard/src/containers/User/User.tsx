import { Flex, IconUser } from '@audius/harmony'
import BN from 'bn.js'
import clsx from 'clsx'
import { useEffect } from 'react'
import { matchPath, useLocation, useParams } from 'react-router-dom'

import ContentTable from 'components/ContentTable'
import DiscoveryTable from 'components/DiscoveryTable'
import Page from 'components/Page'
import Timeline from 'components/Timeline'

import { useAccount } from 'store/account/hooks'
import {
  useActiveInboundDelegation,
  useTotalDelegates,
  useUser,
  useUserDelegates
} from 'store/cache/user/hooks'
import { Operator, Status, User } from 'types'
import { useReplaceRoute } from 'utils/effects'
import { SERVICES_ACCOUNT_USER, accountPage, operatorPage } from 'utils/routes'

import { ConnectAudiusProfileCard } from 'components/ConnectAudiusProfileCard/ConnectAudiusProfileCard'
import { ManageAccountCard } from 'components/ManageAccountCard/ManageAccountCard'
import ProfileInfoCard from 'components/ProfileInfoCard/ProfileInfoCard'
import TransactionStatus from 'components/TransactionStatus'
import getActiveStake from 'utils/activeStake'
import { createStyles } from 'utils/mobile'
import desktopStyles from './User.module.css'
import mobileStyles from './UserMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  operator: 'OPERATOR',
  user: 'USER',
  owner: 'Your Account'
}

const UserPage = () => {
  const { wallet } = useParams<{ wallet: string }>()
  const location = useLocation()

  const { pathname } = location
  const { status, user: userAccount, audiusProfile } = useUser({ wallet })
  const { status: userDelegatesStatus, delegates } = useUserDelegates({
    wallet
  })
  const { wallet: accountWallet } = useAccount()
  const { status: totalDelegatesStatus, totalDelegates } = useTotalDelegates({
    wallet
  })

  const isOwner = accountWallet === wallet

  let user = userAccount as User | Operator

  const isServiceProvider = user && 'serviceProvider' in user

  const hasDiscoveryProviders =
    isServiceProvider && (user as Operator).discoveryProviders.length > 0
  const hasContentNodes =
    isServiceProvider && (user as Operator).contentNodes.length > 0

  const replaceRoute = useReplaceRoute()

  // Check if on user or operator page
  useEffect(() => {
    if (status !== Status.Success) return
    const isUserPath = !!matchPath(pathname, SERVICES_ACCOUNT_USER)
    if (isServiceProvider && isUserPath) replaceRoute(operatorPage(wallet))
    else if (!isServiceProvider && !isUserPath)
      replaceRoute(accountPage(wallet))
  }, [status, wallet, pathname, isServiceProvider, replaceRoute])

  const numDiscoveryNodes = (user as Operator)?.discoveryProviders?.length ?? 0
  const numContentNodes = (user as Operator)?.contentNodes?.length ?? 0
  const activeStake = user ? getActiveStake(user) : new BN('0')
  const inboundDelegation = useActiveInboundDelegation({ wallet })
  const title = isOwner
    ? messages.owner
    : isServiceProvider
    ? messages.operator
    : messages.user
  return (
    <Page icon={IconUser} title={title}>
      <Flex direction="column" gap="l">
        <ProfileInfoCard
          isOwner={isOwner}
          user={user}
          audiusProfile={audiusProfile}
          status={status}
        />
        {isOwner ? <ConnectAudiusProfileCard /> : null}
        {<ManageAccountCard wallet={wallet} />}
        {isOwner ? <TransactionStatus /> : null}
        <Timeline
          className={styles.timeline}
          wallet={user?.wallet}
          timelineType={isServiceProvider ? 'ServiceProvider' : 'Delegator'}
        />
        <div className={styles.serviceContainer}>
          {hasDiscoveryProviders && (
            <DiscoveryTable
              owner={user?.wallet}
              className={clsx(styles.serviceTable, {
                [styles.rightSpacing]: hasContentNodes
              })}
            />
          )}
          {hasContentNodes && (
            <ContentTable
              owner={user?.wallet}
              className={clsx(styles.serviceTable, {
                [styles.leftSpacing]: hasDiscoveryProviders
              })}
            />
          )}
        </div>
      </Flex>
    </Page>
  )
}

export default UserPage
