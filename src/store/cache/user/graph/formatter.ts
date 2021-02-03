import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import BN from 'bn.js'
import { getUserProfile as get3BoxProfile } from 'services/3box'
import { Status, User, ServiceType, Operator } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { setLoading, setUsers } from '../slice'
import { FullUser } from './types'

export const formatUser = async (
  aud: Audius,
  user: FullUser
): Promise<User | Operator> => {
  const userWallet = aud.toChecksumAddress(user.id)
  const profile = await get3BoxProfile(userWallet)

  // TODO: Make this part faster by async loading the profiles
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

  if (user.services.length === 0 && user.stakeAmount === '0')
    return formattedUser

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
      : { amount: new BN(0), lockupExpiryBlock: 0 }
  }
}
