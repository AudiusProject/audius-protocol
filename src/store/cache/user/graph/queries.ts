import { gql } from '@apollo/client'

export const GET_USERS = gql`
  query users($where: User_filter!, $orderBy: User_orderBy!) {
    users(where: $where, orderBy: $orderBy, orderDirection: desc, first: 200) {
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
        first: 200
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
        first: 200
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

export const GET_USER = gql`
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
        first: 200
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
        first: 200
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
