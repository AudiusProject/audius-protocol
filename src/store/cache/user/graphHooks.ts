import { useQuery, gql } from '@apollo/client'
import { useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import BN from 'bn.js'
import { getUserProfile as get3BoxProfile } from 'services/3box'
import { Status, User, Vote, ServiceType, Operator } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers } from './slice'
import { useEffect, useState } from 'react'

const formatUser = async (
  aud: Audius,
  user: FullUser
): Promise<User | Operator> => {
  const userWallet = aud.toChecksumAddress(user.id)
  const profile = await get3BoxProfile(userWallet)

  // TODO: Make this part faster
  const delegatesProfiles = await Promise.all(
    (user.delegateTo || [])
      .map(delegate => delegate.toUser.id)
      .map(id => get3BoxProfile(aud.toChecksumAddress(id)))
  )

  let formattedUser: User = {
    ...profile,
    wallet: userWallet,
    audToken: new BN(user.balance),
    totalDelegatorStake: new BN(user.delegationSentAmount),
    delegates:
      user.delegateTo?.map((delegate, i) => ({
        wallet: aud.toChecksumAddress(delegate.toUser.id),
        amount: new BN(delegate.amount),
        activeAmount: new BN(delegate.claimableAmount),
        name: delegatesProfiles[i].name,
        img: delegatesProfiles[i].image
      })) ?? [],
    events: [],
    voteHistory: user.votes.map(vote => ({
      proposalId: parseInt(vote.proposal.id),
      voter: aud.toChecksumAddress(user.id),
      voterStake: new BN(vote.magnitude),
      blockNumber: parseInt(vote.updatedBlockNumber),
      vote: vote.vote
    })),
    pendingUndelegateRequest: user.pendingUndelegateStake
      ? {
          amount: new BN(user.pendingUndelegateStake.amount),
          lockupExpiryBlock: parseInt(user.pendingUndelegateStake.expiryBlock),
          target: user.pendingUndelegateStake.serviceProvider.id
        }
      : { amount: new BN(0), lockupExpiryBlock: 0, target: '' }
  }

  if (user.services.length === 0) return formattedUser

  // TODO: Make this part faster
  const delegatorProfiles = await Promise.all(
    (user.delegateFrom || [])
      .map(delegate => delegate.fromUser.id)
      .map(id => get3BoxProfile(aud.toChecksumAddress(id)))
  )

  return {
    ...formattedUser,
    // Operator Fields
    serviceProvider: {
      deployerCut: parseInt(user.deployerCut),
      deployerStake: new BN(user.stakeAmount),
      maxAccountStake: new BN(user?.maxAccountStake ?? 0),
      minAccountStake: new BN(user?.minAccountStake ?? 0),
      numberOfEndpoints: user.services?.length ?? 0,
      validBounds: user.validBounds
    },
    delegators:
      user.delegateFrom?.map((delegate, i) => ({
        wallet: aud.toChecksumAddress(delegate.fromUser.id),
        amount: new BN(delegate.amount),
        activeAmount: new BN(delegate.claimableAmount),
        name: delegatorProfiles[i].name,
        img: delegatorProfiles[i].image
      })) ?? [],
    totalStakedFor: (new BN(user.stakeAmount)).add(new BN(user.delegationReceivedAmount)),
    delegatedTotal: new BN(user.delegationReceivedAmount),
    discoveryProviders:
      user.services
        ?.filter(({ type: { id } }) => id === ServiceType.DiscoveryProvider)
        .map(service => parseInt(service.spId)) ?? [],
    contentNodes:
      user.services
        ?.filter(({ type: { id } }) => id === ServiceType.ContentNode)
        .map(service => parseInt(service.spId)) ?? [],
    pendingDecreaseStakeRequest: user.pendingDecreaseStake
      ? {
          amount: new BN(user.pendingDecreaseStake.decreaseAmount),
          lockupExpiryBlock: parseInt(user.pendingDecreaseStake.expiryBlock)
        }
      : { amount: new BN(0), lockupExpiryBlock: 0 }
  }
}

// Async function to get
function populateUsers(
  users: FullUser[],
  setStatus?: (status: Status) => void
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    try {
      if (setStatus) setStatus(Status.Loading)
      else dispatch(setLoading())
      const formattedUsers = await Promise.all(
        users.map(user => formatUser(aud, user))
      )
      dispatch(
        setUsers({
          users: formattedUsers.reduce(
            (users: { [id: string]: User | Operator }, user) => {
              users[user.wallet] = user
              return users
            },
            {}
          ),
          ...(setStatus ? {} : { status: Status.Success })
        })
      )
      if (setStatus) setStatus(Status.Success)
    } catch (err) {
      console.log({ err })
    }
  }
}

const GET_USERS = gql`
  query users($where: User_filter!, $orderBy: User_orderBy!) {
    users(where: $where, orderBy: $orderBy, orderDirection: desc) {
      id
      balance
      totalClaimableAmount
      stakeAmount
      delegationSentAmount
      delegationReceivedAmount
      claimableStakeAmount
      claimableDelegationSentAmount
      claimableDelegationReceivedAmount
      deployerCut
      minAccountStake
      maxAccountStake
      validBounds

      # Get the delegations received
      delegateFrom(
        orderBy: claimableAmount
        orderDirection: desc
        where: { amount_gt: 0 }
      ) {
        claimableAmount
        amount
        fromUser {
          id
        }
      }

      # Get the delegations sent
      delegateTo(
        orderBy: claimableAmount
        orderDirection: desc
        where: { amount_gt: 0 }
      ) {
        claimableAmount
        amount
        toUser {
          id
        }
      }

      # Get the pending actions
      pendingDecreaseStake {
        id
        expiryBlock
        decreaseAmount
      }
      pendingUndelegateStake {
        id
        amount
        expiryBlock
        serviceProvider {
          id
        }
      }
      pendingRemoveDelegator {
        id
        expiryBlock
        delegator {
          id
        }
      }
      pendingUpdateDeployerCut {
        id
        expiryBlock
        updatedCut
      }

      # Fetch the user's services
      services(where: { isRegistered: true }) {
        type {
          id
        }
        spId
        endpoint
        delegateOwnerWallet
      }

      votes {
        id
        vote
        magnitude
        updatedBlockNumber
        proposal {
          id
        }
      }
    }
  }
`

interface FullUser {
  id: string
  balance: string
  totalClaimableAmount: string
  stakeAmount: string
  delegationSentAmount: string
  delegationReceivedAmount: string
  claimableStakeAmount: string
  claimableDelegationSentAmount: string
  claimableDelegationReceivedAmount: string
  deployerCut: string
  minAccountStake: string
  maxAccountStake: string
  validBounds: boolean

  delegateTo?: {
    claimableAmount: string
    amount: string
    toUser: {
      id: string
    }
  }[]

  delegateFrom?: {
    claimableAmount: string
    amount: string
    fromUser: {
      id: string
    }
  }[]

  pendingDecreaseStake?: {
    id: string
    decreaseAmount: string
    expiryBlock: string
  }
  pendingUndelegateStake: {
    id: string
    amount: string
    expiryBlock: string
    serviceProvider: { id: string }
  }
  pendingRemoveDelegator: {
    id: string
    delegator: { id: string }
    expiryBlock: string
  }
  pendingUpdateDeployerCut: {
    id: string
    updatedCut: string
    expiryBlock: string
  }

  services: {
    type: { id: string }
    endpoint: string
    spId: string
    delegateOwnerWallet: string
  }[]

  votes: {
    id: string
    vote: Vote
    magnitude: string
    updatedBlockNumber: string
    proposal: { id: string }
  }[]
}

interface UsersData {
  users: FullUser[]
}

interface UsersVars {
  orderBy: string
  where?: { hasStakeOrDelegation: boolean }
}

// -------------------------------- Hooks  --------------------------------
export const useUsers = (status: Status | undefined) => {
  const { error: gqlError, data: gqlData } = useQuery<UsersData, UsersVars>(
    GET_USERS,
    {
      variables: {
        orderBy: 'totalClaimableAmount',
        where: { hasStakeOrDelegation: true }
      }
    }
  )
  const dispatch = useDispatch()
  useEffect(() => {
    if (status !== Status.Loading && status !== Status.Success && gqlData) {
      dispatch(populateUsers(gqlData.users))
    }
  }, [gqlData, dispatch, status])

  return {
    error: gqlError
  }
}

const GET_USER = gql`
  query user($id: String!) {
    user(id: $id) {
      id
      balance
      totalClaimableAmount
      stakeAmount
      delegationSentAmount
      delegationReceivedAmount
      claimableStakeAmount
      claimableDelegationSentAmount
      claimableDelegationReceivedAmount
      deployerCut
      minAccountStake
      maxAccountStake
      validBounds

      # Get the delegations received
      delegateFrom(
        orderBy: claimableAmount
        orderDirection: desc
        where: { amount_gt: 0 }
      ) {
        claimableAmount
        amount
        fromUser {
          id
        }
      }

      # Get the delegations sent
      delegateTo(
        orderBy: claimableAmount
        orderDirection: desc
        where: { amount_gt: 0 }
      ) {
        claimableAmount
        amount
        toUser {
          id
        }
      }

      # Get the pending actions
      pendingDecreaseStake {
        id
        expiryBlock
        decreaseAmount
      }
      pendingUndelegateStake {
        id
        amount
        expiryBlock
        serviceProvider {
          id
        }
      }
      pendingRemoveDelegator {
        id
        expiryBlock
        delegator {
          id
        }
      }
      pendingUpdateDeployerCut {
        id
        expiryBlock
        updatedCut
      }

      # Fetch the user's services
      services(where: { isRegistered: true }) {
        type {
          id
        }
        spId
        endpoint
        delegateOwnerWallet
      }

      votes {
        id
        vote
        magnitude
        updatedBlockNumber
        proposal {
          id
        }
      }
    }
  }
`

interface UserData {
  user: FullUser
}

interface UserVars {
  id: string
}

export const useUser = (
  wallet: string,
  setStatus: (status: Status) => void
) => {
  const [didFetch, setDidFetch] = useState(false)
  const { error: gqlError, data: gqlData } = useQuery<UserData, UserVars>(
    GET_USER,
    {
      variables: { id: wallet.toLowerCase() }
    }
  )

  useEffect(() => {
    setDidFetch(false)
  }, [wallet, setDidFetch])

  const dispatch = useDispatch()
  useEffect(() => {
    if (!didFetch && gqlData) {
      setDidFetch(true)
      dispatch(populateUsers([gqlData.user], setStatus))
    }
  }, [gqlData, dispatch, setStatus, didFetch, setDidFetch])

  return {
    error: gqlError
  }
}
