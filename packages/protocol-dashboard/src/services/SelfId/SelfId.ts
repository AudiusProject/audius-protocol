import { Address } from 'types'
import { getRandomDefaultImage } from 'utils/identicon'
import { Core } from '@self.id/core'
import { getLegacy3BoxProfileAsBasicProfile } from '@self.id/3box-legacy'
import { IdxUser } from './types'

const core = new Core({ ceramic: 'https://gateway.ceramic.network' })

const ipfsGateway = 'https://ipfs.infura.io/ipfs/'

type User = {
  status?: string
  name?: string
  image: string
}

type UserWithCache = User & {
  noCache?: boolean
}

const transformIdxUser = (user: IdxUser): User => {
  const imageSrc = user?.image?.original?.src
  let image = ''
  if (imageSrc && imageSrc.startsWith('ipfs://')) {
    const cid = imageSrc.substring(7)
    image = `${ipfsGateway}${cid}`
  }
  return { ...user, image }
}

export const getSelfIdProfile = async (
  wallet: Address
): Promise<UserWithCache> => {
  let profile: User | null = null

  try {
    let idxUser: IdxUser | null = await core.get(
      'basicProfile',
      `eip155:1:${wallet}`
    )
    if (idxUser) {
      profile = transformIdxUser(idxUser)
    } else {
      profile = await getLegacy3BoxProfileAsBasicProfile(wallet)
    }
  } catch (e) {
    profile = await getLegacy3BoxProfileAsBasicProfile(wallet)
  }

  if (!profile) {
    const image = getRandomDefaultImage(wallet)
    profile = { image }
  }

  return profile
}

export const getUserProfile = async (wallet: string): Promise<User> => {
  const profile = await getSelfIdProfile(wallet)
  return {
    name: profile.name || wallet,
    image: profile.image
  }
}
