import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { Utils } from '@audius/libs'
import BN from 'bn.js'
import {
  Address,
  Status,
  User,
  SortUser,
  ServiceType,
  Operator,
  Delegate,
  ServiceProvider
} from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers, setUserProfile } from './slice'
import { useEffect } from 'react'
import {
  getFilteredNodes as getDPNodes,
  fetchDiscoveryProviders
} from '../discoveryProvider/hooks'
import {
  getFilteredNodes as getCNNodes,
  fetchContentNodes
} from '../contentNode/hooks'
import { useAccountUser } from 'store/account/hooks'
import { GetPendingDecreaseStakeRequestResponse } from 'services/Audius/service-provider/types'
import getActiveStake, { getTotalActiveDelegatedStake } from 'utils/activeStake'
import {
  useUser as useGraphUser,
  useUsers as useGraphUsers
} from './graph/hooks'
import getUserProfile from 'services/3box'

type UseUsersProp = {
  sortBy?: SortUser
  limit?: number
  filter?: 'isOperator' | 'isDelegator'
}

// -------------------------------- Selectors  --------------------------------
export const getStatus = (state: AppState) => state.cache.user.status
export const getUser = (wallet: Address) => (state: AppState) =>
  state.cache.user.accounts[wallet]

const sortActiveStakeFunc = (u1: User | Operator, u2: User | Operator) => {
  let u1Total = getActiveStake(u1)
  let u2Total = getActiveStake(u2)
  return u2Total.cmp(u1Total)
}

const sortStakePlusDelegatedFunc = (
  u1: User | Operator,
  u2: User | Operator
) => {
  const u1Total = getActiveStake(u1).add(getTotalActiveDelegatedStake(u1))
  const u2Total = getActiveStake(u2).add(getTotalActiveDelegatedStake(u2))
  return u2Total.cmp(u1Total)
}

export const getUsers = ({ sortBy, limit, filter }: UseUsersProp) => (
  state: AppState
) => {
  const userAccounts = state.cache.user.accounts
  let accounts: (User | Operator)[] = Object.values(userAccounts)

  const filterFunc = (user: User | Operator) => {
    if (filter === 'isOperator') return 'serviceProvider' in user
    return true
  }

  let serviceProviders: (User | Operator)[] = accounts.filter(filterFunc) as any
  if (sortBy === SortUser.activeStake) {
    serviceProviders = serviceProviders.sort(sortActiveStakeFunc)
  } else if (sortBy === SortUser.stakePlusDelegates) {
    serviceProviders = serviceProviders.sort(sortStakePlusDelegatedFunc)
  }
  if (limit) serviceProviders = serviceProviders.slice(0, limit)

  return serviceProviders
}

// -------------------------------- Helpers  --------------------------------

const getUserMetadata = async (wallet: Address, aud: Audius): Promise<User> => {
  const audToken = await aud.AudiusToken.balanceOf(wallet)
  const delegates = await aud.getUserDelegates(wallet)
  const totalDelegatorStake = await aud.Delegate.getTotalDelegatorStake(wallet)
  const pendingUndelegateRequest = await aud.Delegate.getPendingUndelegateRequest(
    wallet
  )
  const voteHistory = await aud.Governance.getVotesByAddress([wallet])

  const user = {
    wallet,
    totalDelegatorStake,
    pendingUndelegateRequest,
    audToken,
    delegates,
    voteHistory,
    events: []
  }

  return user
}

const getServiceProviderMetadata = async (
  wallet: Address,
  aud: Audius
): Promise<{
  serviceProvider: ServiceProvider
  discoveryProviders: Array<number>
  pendingDecreaseStakeRequest: GetPendingDecreaseStakeRequestResponse
  contentNodes: Array<number>
  delegators: Array<Delegate>
  delegatedTotal: BN
  totalStakedFor: BN
  minDelegationAmount: BN
}> => {
  const totalStakedFor = await aud.Staking.totalStakedFor(wallet)
  const delegatedTotal = await aud.Delegate.getTotalDelegatedToServiceProvider(
    wallet
  )
  let delegators = await getDelegatorAmounts(wallet, aud)
  delegators.sort((a, b) => (b.activeAmount.gt(a.activeAmount) ? 1 : -1))
  const serviceProvider: ServiceProvider = await aud.ServiceProviderClient.getServiceProviderDetails(
    wallet
  )
  const discoveryProviders = await aud.ServiceProviderClient.getServiceProviderIdsFromAddress(
    wallet,
    ServiceType.DiscoveryProvider
  )
  const contentNodes = await aud.ServiceProviderClient.getServiceProviderIdsFromAddress(
    wallet,
    ServiceType.ContentNode
  )
  const pendingDecreaseStakeRequest = await aud.ServiceProviderClient.getPendingDecreaseStakeRequest(
    wallet
  )

  const protocolMinDelegationAmount = await aud.Delegate.getMinDelegationAmount()
  let minDelegationAmount = await aud.Identity.getMinimumDelegationAmount(wallet)
  if (minDelegationAmount === null || protocolMinDelegationAmount.gt(minDelegationAmount)) {
    minDelegationAmount = protocolMinDelegationAmount
  }

  return {
    serviceProvider,
    discoveryProviders,
    pendingDecreaseStakeRequest,
    contentNodes,
    totalStakedFor,
    delegatedTotal,
    delegators,
    minDelegationAmount
  }
}

const getDelegatorAmounts = async (
  wallet: Address,
  aud: Audius
): Promise<Array<{
  wallet: Address
  amount: BN
  activeAmount: BN
  // name?: string
  // img: string
}>> => {
  const delegators = await aud.Delegate.getDelegatorsList(wallet)
  let delegatorAmounts = []
  for (let delegatorWallet of delegators) {
    const amountDelegated = await aud.Delegate.getDelegatorStakeForServiceProvider(
      delegatorWallet,
      wallet
    )
    let activeAmount = amountDelegated
    const pendingUndelegateRequest = await aud.Delegate.getPendingUndelegateRequest(
      delegatorWallet
    )

    if (
      pendingUndelegateRequest.lockupExpiryBlock !== 0 &&
      pendingUndelegateRequest.target === wallet
    ) {
      activeAmount = activeAmount.sub(pendingUndelegateRequest.amount)
    }

    delegatorAmounts.push({
      wallet: delegatorWallet,
      amount: amountDelegated,
      activeAmount
    })
  }
  return delegatorAmounts
}

// -------------------------------- Thunk Actions  --------------------------------

// Async function to get
function fetchUsers(): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    dispatch(setLoading())
    await Promise.all([
      dispatch(fetchDiscoveryProviders()),
      dispatch(fetchContentNodes())
    ])
    const state = getState()
    const dpNodes = getDPNodes()(state)
    const cnNodes = getCNNodes()(state)
    let serviceProviderWallets = dpNodes
      .map(dp => dp.owner)
      .concat(cnNodes.map(cn => cn.owner))
    // @ts-ignore
    serviceProviderWallets = [...new Set(serviceProviderWallets)]

    const users: { [wallet: string]: User | Operator } = {}
    await Promise.all(
      serviceProviderWallets.map(async wallet => {
        const user = await getUserMetadata(wallet, aud)
        const serviceProvider = await getServiceProviderMetadata(wallet, aud)
        users[wallet] = {
          ...user,
          ...serviceProvider
        }
      })
    )

    // Get all delegators that are not service operators
    let delegators = Object.keys(users).reduce(
      (delgators: string[], operatorWallet) => {
        const operator = users[operatorWallet]
        const operatorDelegators = (operator as Operator).delegators
          .map(delegator => delegator.wallet)
          .filter(wallet => !(wallet in users))
        return delgators.concat(operatorDelegators)
      },
      []
    )
    // @ts-ignore
    delegators = [...new Set(delegators)]

    await Promise.all(
      delegators.map(async wallet => {
        const user = await getUserMetadata(wallet, aud)
        users[wallet] = user
      })
    )

    dispatch(
      setUsers({
        users,
        status: Status.Success
      })
    )
  }
}

// Async function to get
export function fetchUser(
  wallet: Address,
  setStatus?: (status: Status) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    if (setStatus) setStatus(Status.Loading)
    const user = await getUserMetadata(wallet, aud)

    const isStaker = await aud.Staking.isStaker(wallet)
    if (!isStaker) {
      dispatch(
        setUsers({
          users: { [wallet]: user }
        })
      )
    } else {
      const serviceProvider = await getServiceProviderMetadata(wallet, aud)
      const account = {
        ...user,
        ...serviceProvider
      }
      dispatch(
        setUsers({
          users: { [wallet]: account }
        })
      )
    }
    if (setStatus) setStatus(Status.Success)
  }
}

export function fetchUserProfile(
  wallet: Address
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const profile = await getUserProfile(wallet)
    dispatch(
      setUserProfile({
        wallet,
        image: profile.image,
        name: profile.name
      })
    )
  }
}

// -------------------------------- Hooks  --------------------------------
export const useUsers = ({ limit, sortBy, filter }: UseUsersProp = {}) => {
  const status = useSelector(getStatus)
  const users = useSelector(getUsers({ limit, sortBy, filter }))

  const { error } = useGraphUsers(status)

  const dispatch = useDispatch()
  useEffect(() => {
    if (error && !status) {
      dispatch(fetchUsers())
    }
  }, [error, status, limit, sortBy, dispatch])

  return { status, users }
}

type UseUserProps = { wallet: Address }
type UseUserResponse =
  | {
      user: User | Operator
      status: Status.Success
    }
  | {
      user: undefined
      status: Status.Failure | Status.Loading
    }
export const useUser = ({ wallet }: UseUserProps): UseUserResponse => {
  const [status, setStatus] = useState(Status.Loading)
  const user = useSelector(getUser(wallet))

  useEffect(() => {
    if (status !== Status.Loading && !user) setStatus(Status.Loading)
  }, [wallet, user, status])

  const { error } = useGraphUser(wallet, setStatus, !!user)

  const dispatch = useDispatch()
  useEffect(() => {
    if (error && !user && status !== Status.Failure) {
      dispatch(fetchUser(wallet, setStatus))
    }
  }, [error, wallet, user, setStatus, status, dispatch])
  if (user) {
    if (status !== Status.Success) setStatus(Status.Success)
    return { user, status: Status.Success }
  } else if (!user && status === Status.Success) {
    return { user: undefined, status: Status.Loading }
  } else {
    return {
      user: undefined,
      status: status as Status.Loading | Status.Failure
    }
  }
}

type UseDelegatorsProps = { wallet: Address }
export const useDelegators = ({ wallet }: UseDelegatorsProps) => {
  const { status, user } = useUser({ wallet })
  if (status !== Status.Success || !user || !('delegators' in user)) {
    return { status, delegators: [] }
  }
  return { status, delegators: user.delegators }
}

type UseDelegatesProps = { wallet: Address }
export const useDelegates = ({ wallet }: UseDelegatesProps) => {
  const { status, user } = useUser({ wallet })
  if (status !== Status.Success || !user) {
    return { status, delegates: [] }
  }
  return { status, delegates: user.delegates }
}

type UseTotalDelegatesProps = { wallet: Address }
export const useTotalDelegates = ({ wallet }: UseTotalDelegatesProps) => {
  const { status, user } = useUser({ wallet })
  if (status !== Status.Success || !user) {
    return { status, totalDelegates: Utils.toBN('0') }
  }
  let totalDelegates = user.delegates.reduce(
    (total, delegate) => total.add(delegate.amount),
    Utils.toBN('0')
  )
  return { status, totalDelegates }
}

/** Returns the total amount delegated inbound to an SP */
export const useActiveInboundDelegation = ({ wallet }: { wallet: Address }) => {
  const { status, user } = useUser({ wallet })
  if (status !== Status.Success || !user) {
    return { status, amount: Utils.toBN('0') }
  }

  let totalDelegated = (user as Operator).delegators
  if (!totalDelegated) return { status, amount: Utils.toBN('0') }

  const totalInboundDelegation = (user as Operator).delegators.reduce(
    (total, delegator) => total.add(delegator.activeAmount),
    Utils.toBN('0')
  )
  return { status, amount: totalInboundDelegation }
}

/**
 * Get the amount the signed in user delegates to the wallet address
 */
type UseUserDelegates = { wallet: Address }
export const useUserDelegates = ({ wallet }: UseUserDelegates) => {
  const { status, user } = useAccountUser()
  if (status !== Status.Success || !user) {
    return { status: status || Status.Loading, delegates: Utils.toBN('0') }
  }
  let userDelegates = user.delegates.find(d => d.wallet === wallet)
  if (userDelegates) {
    return { status: Status.Success, delegates: userDelegates.amount }
  }
  return { status: Status.Success, delegates: Utils.toBN('0') }
}

const inFlight = new Set<Address>([])
type UseUserProfile = { wallet: Address }
export const useUserProfile = ({ wallet }: UseUserProfile) => {
  const { user } = useUser({ wallet })

  const dispatch = useDispatch()
  useEffect(() => {
    if (user && !inFlight.has(wallet)) {
      inFlight.add(wallet)
      dispatch(fetchUserProfile(wallet))
    }
  }, [dispatch, user, wallet])

  if (user) {
    return { image: user.image, name: user.name }
  }
  return {}
}
