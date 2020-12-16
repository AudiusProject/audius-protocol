import React, { useEffect } from 'react'
import clsx from 'clsx'
import { RouteComponentProps } from 'react-router'
import { matchPath } from 'react-router-dom'
import { Utils } from '@audius/libs'

import Page from 'components/Page'
import Delegate from 'components/Delegate'
import Timeline from 'components/Timeline'
import UserStat from 'components/UserStat'
import UserStakedStat from 'components/UserStakedStat'
import DiscoveryTable from 'components/DiscoveryTable'
import ContentTable from 'components/ContentTable'
import DelegatorsTable from 'components/DelegatorsTable'
import DelegatesTable from 'components/DelegatesTable'
import UserInfo from 'components/UserInfo'
import ManageService from 'components/ManageService'

import {
  useUser,
  useTotalDelegates,
  useUserDelegates
} from 'store/cache/user/hooks'
import { Status, User, Operator } from 'types'
import { useAccount } from 'store/account/hooks'
import {
  SERVICES_ACCOUNT_USER,
  SERVICES_TITLE,
  SERVICES,
  operatorPage,
  accountPage
} from 'utils/routes'
import { useReplaceRoute } from 'utils/effects'

import desktopStyles from './User.module.css'
import mobileStyles from './UserMobile.module.css'
import { createStyles } from 'utils/mobile'
import getActiveStake from 'utils/activeStake'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  operator: 'OPERATOR',
  user: 'USER'
}

type OwnProps = {}
type UserPageProps = OwnProps & RouteComponentProps<{ wallet: string }>

const UserPage: React.FC<UserPageProps> = (props: UserPageProps) => {
  const {
    location: { pathname },
    match: {
      params: { wallet }
    }
  } = props
  const { status, user: userAccount } = useUser({ wallet })
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
    const isUserPath = !!matchPath(pathname, { path: SERVICES_ACCOUNT_USER })
    if (isServiceProvider && isUserPath) replaceRoute(operatorPage(wallet))
    else if (!isServiceProvider && !isUserPath)
      replaceRoute(accountPage(wallet))
  }, [status, wallet, pathname, isServiceProvider, replaceRoute])

  if (status !== Status.Success) return null
  const services =
    ((user as Operator)?.discoveryProviders?.length ?? 0) +
    ((user as Operator)?.contentNodes?.length ?? 0)
  const activeStake = user ? getActiveStake(user) : Utils.toBN('0')

  return (
    <Page
      title={isServiceProvider ? messages.operator : messages.user}
      defaultPreviousPage={SERVICES_TITLE}
      defaultPreviousPageRoute={SERVICES}
    >
      <div className={styles.userInfoRow}>
        <UserInfo
          className={styles.userInfoTile}
          user={user}
          delegates={delegates}
          delegatesStatus={userDelegatesStatus}
          services={services}
          isOwner={isOwner}
        />
        {isServiceProvider ? (
          <UserStat
            staked={activeStake}
            deployerCut={(user as Operator).serviceProvider.deployerCut}
            delegators={(user as Operator).delegators.length}
            totalDelegates={totalDelegates}
            totalDelegatesStatus={totalDelegatesStatus}
            services={services}
          />
        ) : (
          <UserStakedStat
            wallet={user.wallet}
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
      {!delegates.isZero() && (
        <Delegate
          wallet={user.wallet}
          delegates={delegates}
          className={styles.delegateContainer}
        />
      )}
      <Timeline className={styles.timeline} wallet={user.wallet} />
      {isServiceProvider && (user as Operator).delegators.length > 0 && (
        <DelegatorsTable
          wallet={user.wallet}
          className={styles.delegatorsContainer}
        />
      )}
      <DelegatesTable
        wallet={user.wallet}
        className={styles.delegatesContainer}
      />
      <div className={styles.serviceContainer}>
        {hasDiscoveryProviders && (
          <DiscoveryTable
            owner={user.wallet}
            className={clsx(styles.serviceTable, {
              [styles.rightSpacing]: hasContentNodes
            })}
          />
        )}
        {hasContentNodes && (
          <ContentTable
            owner={user.wallet}
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
