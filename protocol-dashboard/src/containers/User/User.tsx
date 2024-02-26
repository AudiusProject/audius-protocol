import { useEffect, useMemo } from 'react'

import BN from 'bn.js'
import clsx from 'clsx'
import { matchPath, useLocation, useParams } from 'react-router-dom'

import ContentTable from 'components/ContentTable'
import Delegate from 'components/Delegate'
import DelegatesTable from 'components/DelegatesTable'
import DelegationStatsChip from 'components/DelegationStatsChip/DelegationStatsChip'
import DelegatorsTable from 'components/DelegatorsTable'
import DiscoveryTable from 'components/DiscoveryTable'
import ManageService from 'components/ManageService'
import Page from 'components/Page'
import StakingStat from 'components/StakingStat'
import Timeline from 'components/Timeline'
import UserInfo from 'components/UserInfo'
import UserStakedStat from 'components/UserStakedStat'
import { useAccount } from 'store/account/hooks'
import {
  useUser,
  useTotalDelegates,
  useUserDelegates,
  useActiveInboundDelegation
} from 'store/cache/user/hooks'
import { Status, User, Operator } from 'types'
import getActiveStake from 'utils/activeStake'
import { useReplaceRoute } from 'utils/effects'
import { createStyles } from 'utils/mobile'
import {
  SERVICES_ACCOUNT_USER,
  SERVICES_TITLE,
  SERVICES,
  operatorPage,
  accountPage
} from 'utils/routes'

import desktopStyles from './User.module.css'
import mobileStyles from './UserMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  operator: 'OPERATOR',
  user: 'USER',
  owner: 'Your Wallet'
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

  const user = userAccount as User | Operator

  const isServiceProvider = user && 'serviceProvider' in user

  // Prior to user load, use the path to determine if we're on the user or operator page
  // to determine whether we're using 1 or 2 skeleton tiles
  //
  // FIXME: ideally this would just use `isServiceProvider`,
  // but if that's set to true before the user actually loads
  // we have type errors everywhere :(
  const showServiceProviderSkeletonTiles = useMemo(() => {
    if (isServiceProvider) return true
    return !matchPath(pathname, SERVICES_ACCOUNT_USER)
  }, [isServiceProvider, pathname])

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
    <Page
      title={title}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      <div className={styles.userInfoRow}>
        <UserInfo
          user={user}
          audiusProfile={audiusProfile}
          status={status}
          delegates={delegates}
          delegatesStatus={userDelegatesStatus}
          services={numDiscoveryNodes + numContentNodes}
          isOwner={isOwner}
        />
        {showServiceProviderSkeletonTiles ? (
          <>
            <StakingStat
              className={styles.stakingStat}
              staked={activeStake}
              totalDelegates={totalDelegates}
              totalDelegatesStatus={totalDelegatesStatus}
              numDiscoveryNodes={numDiscoveryNodes}
              numContentNodes={numContentNodes}
              isLoading={status === Status.Loading}
            />
            <DelegationStatsChip
              className={styles.delegationState}
              deployerCut={
                (user as Operator | undefined)?.serviceProvider?.deployerCut ??
                0
              }
              delegated={inboundDelegation.amount ?? new BN('0')}
              minDelegation={
                (user as Operator | undefined)?.minDelegationAmount ??
                new BN('0')
              }
              delegators={
                (user as Operator | undefined)?.delegators?.length ?? 0
              }
              isLoading={status === Status.Loading}
            />
          </>
        ) : (
          <UserStakedStat
            className={styles.stakingStat}
            wallet={user?.wallet}
            isLoading={status !== Status.Success}
            totalDelegates={activeStake}
            totalDelegatesStatus={totalDelegatesStatus}
          />
        )}
      </div>
      {isOwner && (
        <ManageService
          className={styles.manageService}
          showViewActiveServices={false}
        />
      )}
      {!delegates.isZero() && user && (
        <Delegate
          wallet={user.wallet}
          delegates={delegates}
          className={styles.delegateContainer}
        />
      )}
      <Timeline
        className={styles.timeline}
        wallet={user?.wallet}
        timelineType={isServiceProvider ? 'ServiceProvider' : 'Delegator'}
      />
      {(user as Operator)?.delegators?.length > 0 && (
        <DelegatorsTable
          wallet={user.wallet}
          className={styles.delegatorsContainer}
        />
      )}
      {user && (
        <DelegatesTable
          wallet={user.wallet}
          className={styles.delegatesContainer}
        />
      )}
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
    </Page>
  )
}

export default UserPage
