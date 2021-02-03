import { Vote } from 'types'

export interface FullUser {
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

export interface UsersData {
  users: FullUser[]
}

export interface UsersVars {
  orderBy: string
  where?: { hasStakeOrDelegation: boolean }
}

export interface UserData {
  user: FullUser
}

export interface UserVars {
  id: string
}
