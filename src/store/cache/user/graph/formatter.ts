import BN from 'bn.js'
import { User, ServiceType, Operator, ServiceProvider } from 'types'
import Audius from 'services/Audius'
import { FullUser } from './types'

export const formatUser = async (
  aud: Audius,
  user: FullUser
): Promise<User | Operator> => {
  const userWallet = aud.toChecksumAddress(user.id)
  let formattedUser: User = {
    wallet: userWallet,
    audToken: new BN(user.balance),
    totalDelegatorStake: new BN(user.delegationSentAmount),
    delegates:
      user.delegateTo?.map((delegate, i) => ({
        wallet: aud.toChecksumAddress(delegate.toUser.id),
        amount: new BN(delegate.amount),
        activeAmount: new BN(delegate.claimableAmount)
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

  if (user.services.length === 0 && user.stakeAmount === '0')
    return formattedUser

  // Note: We must make a contract call to check "validBounds" because that value is not
  // updated with the graph
  const serviceProvider: ServiceProvider = await aud.ServiceProviderClient.getServiceProviderDetails(
    userWallet
  )

  // Fetch the user's min delegation amount and default to the protocol value if not set or too low
  const protocolMinDelegationAmount = await aud.Delegate.getMinDelegationAmount()
  let minDelegationAmount = await aud.Identity.getMinimumDelegationAmount(userWallet)
  if (minDelegationAmount === null || protocolMinDelegationAmount.gt(minDelegationAmount)) {
    minDelegationAmount = protocolMinDelegationAmount
  }


  return {
    ...formattedUser,
    serviceProvider,
    delegators:
      user.delegateFrom?.map((delegate, i) => ({
        wallet: aud.toChecksumAddress(delegate.fromUser.id),
        amount: new BN(delegate.amount),
        activeAmount: new BN(delegate.claimableAmount)
      })) ?? [],
    totalStakedFor: new BN(user.stakeAmount).add(
      new BN(user.delegationReceivedAmount)
    ),
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
      : { amount: new BN(0), lockupExpiryBlock: 0 },
    minDelegationAmount
  }
}
