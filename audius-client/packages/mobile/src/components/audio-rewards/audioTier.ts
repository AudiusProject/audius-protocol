import { User } from 'audius-client/src/common/models/User'
import BN from 'bn.js'

export const WEI = new BN('1000000000000000000')

export type AudioTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'

const audioTierRequirements: { tier: AudioTier; minAudio: BN }[] = [
  {
    tier: 'platinum',
    minAudio: new BN('100000')
  },
  {
    tier: 'gold',
    minAudio: new BN('10000')
  },
  {
    tier: 'silver',
    minAudio: new BN('100')
  },
  {
    tier: 'bronze',
    minAudio: new BN('10')
  },
  {
    tier: 'none',
    minAudio: new BN('0')
  }
]

export const audioTierOrder: AudioTier[] = [
  'none',
  'bronze',
  'silver',
  'gold',
  'platinum'
]

export const getAudioTierRank = (tier: AudioTier) => {
  return audioTierOrder.indexOf(tier)
}

export const getUserAudioTier = (
  user: Pick<User, 'balance' | 'associated_wallets_balance'>
) => {
  const totalBalance = new BN(user.balance ?? '0')
    .add(new BN(user.associated_wallets_balance ?? '0'))
    .div(WEI)

  const index = audioTierRequirements.findIndex(t => {
    return t.minAudio.lte(totalBalance)
  })

  const tier = index === -1 ? 'none' : audioTierRequirements[index].tier
  return tier
}
