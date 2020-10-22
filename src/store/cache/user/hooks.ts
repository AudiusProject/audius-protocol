import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import { Utils } from '@audius/libs'
import { getUserProfile as get3BoxProfile } from 'services/3box'
import { getRandomDefaultImage } from 'utils/identicon'
import BN from 'bn.js'
import {
  Address,
  Status,
  User,
  SortUser,
  ServiceType,
  Operator,
  Delegate,
  ServiceProvider,
  VoteEvent
} from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers } from './slice'
import { useEffect } from 'react'
import {
  getFilteredNodes as getDPNodes,
  fetchDiscoveryProviders
} from '../discoveryProvider/hooks'
import {
  getFilteredNodes as getCNNodes,
  fetchCreatorNodes
} from '../creatorNode/hooks'
import { useAccountUser } from 'store/account/hooks'

type UseUsersProp = {
  sortBy?: SortUser
  limit?: number
}

// -------------------------------- Selectors  --------------------------------
export const getStatus = (state: AppState) => state.cache.user.status
export const getUser = (wallet: Address) => (state: AppState) =>
  state.cache.user.accounts[wallet]

export const getServiceProviders = ({ sortBy, limit }: UseUsersProp) => (
  state: AppState
) => {
  const userAccounts = state.cache.user.accounts
  let accounts: (User | Operator)[] = Object.values(userAccounts)

  const filterFunc = (user: User | Operator) => {
    if ('serviceProvider' in user) return true
    return false
  }

  const sortFunc = (u1: Operator, u2: Operator) => {
    let u1Total = u1.delegatedTotal.add(u1.serviceProvider.deployerStake)
    let u2Total = u2.delegatedTotal.add(u2.serviceProvider.deployerStake)
    return u2Total.cmp(u1Total)
  }

  let serviceProviders: Operator[] = accounts.filter(filterFunc) as any
  serviceProviders = serviceProviders.sort(sortFunc)
  if (limit) serviceProviders = serviceProviders.slice(0, limit)

  return serviceProviders
}

// -------------------------------- Helpers  --------------------------------

const getUserMetadata = async (wallet: Address, aud: Audius): Promise<User> => {
  const audToken = await aud.AudiusToken.balanceOf(wallet)
  const profile = await get3BoxProfile(wallet)
  const delegates = await aud.getUserDelegates(wallet)

  const user = {
    wallet,
    image: getRandomDefaultImage(wallet),
    ...profile,
    audToken,
    delegates,
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
  creatorNodes: Array<number>
  delegators: Array<Delegate>
  delegatedTotal: BN
  totalStakedFor: BN
  voteHistory: Array<VoteEvent>
}> => {
  const totalStakedFor = await aud.Staking.totalStakedFor(wallet)
  const delegatedTotal = await aud.Delegate.getTotalDelegatedToServiceProvider(
    wallet
  )
  const delegators = await getDelegatorAmounts(wallet, aud)
  const serviceProvider: ServiceProvider = await aud.ServiceProviderClient.getServiceProviderDetails(
    wallet
  )
  const discoveryProviders = await aud.ServiceProviderClient.getServiceProviderIdsFromAddress(
    wallet,
    ServiceType.DiscoveryProvider
  )
  const creatorNodes = await aud.ServiceProviderClient.getServiceProviderIdsFromAddress(
    wallet,
    ServiceType.CreatorNode
  )
  const voteHistory = await aud.Governance.getVotesByAddress([wallet])
  return {
    serviceProvider,
    discoveryProviders,
    creatorNodes,
    totalStakedFor,
    delegatedTotal,
    delegators,
    voteHistory
  }
}

const getDelegatorAmounts = async (
  wallet: Address,
  aud: Audius
): Promise<Array<{
  wallet: Address
  amount: BN
  name?: string
  img: string
}>> => {
  const delegators = await aud.Delegate.getDelegatorsList(wallet)
  let delegatorAmounts = []
  for (let delegatorWallet of delegators) {
    const amountDelegated = await aud.Delegate.getDelegatorStakeForServiceProvider(
      delegatorWallet,
      wallet
    )
    const profile = await get3BoxProfile(wallet)
    let img = profile.image || getRandomDefaultImage(delegatorWallet)

    delegatorAmounts.push({
      wallet: delegatorWallet,
      amount: amountDelegated,
      name: profile.name,
      img
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
      dispatch(fetchCreatorNodes())
    ])
    const state = getState()
    const dpNodes = getDPNodes()(state)
    const cnNodes = getCNNodes()(state)
    let serviceProviderWallets = dpNodes
      .map(dp => dp.owner)
      .concat(cnNodes.map(cn => cn.owner))
    // @ts-ignore
    serviceProviderWallets = [...new Set(serviceProviderWallets)]

    const users: { [wallet: string]: Operator } = {}
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

// -------------------------------- Hooks  --------------------------------
export const useServiceProviders = ({ limit, sortBy }: UseUsersProp = {}) => {
  const status = useSelector(getStatus)
  const users = useSelector(getServiceProviders({ limit, sortBy }))

  const dispatch = useDispatch()
  useEffect(() => {
    if (!status) {
      dispatch(fetchUsers())
    }
  }, [status, limit, sortBy, dispatch])
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

  const dispatch = useDispatch()
  useEffect(() => {
    if (!user && status !== Status.Failure) {
      dispatch(fetchUser(wallet, setStatus))
    }
  }, [wallet, user, setStatus, status, dispatch])
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
