import { Core } from '@self.id/core'

import { Address } from 'types'
import { getRandomDefaultImage } from 'utils/identicon'

import { IdxUser } from './types'

const core = new Core({ ceramic: 'https://ceramic-audius.hirenodes.io' })

const ipfsGateway = 'https://ipfs.io/ipfs/'

type User = {
  status?: string
  name?: string
  image: string
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

const getSelfIdUser = async (wallet: string) => {
  const idxUser: IdxUser | null = await core.get(
    'basicProfile',
    `eip155:1:${wallet}`
  )
  if (idxUser) {
    return transformIdxUser(idxUser)
  }
  return null
}

export const getSelfIdProfile = async (wallet: Address): Promise<User> => {
  let profile: User | null = null

  try {
    profile = await getSelfIdUser(wallet)
  } catch (e) {
    console.error(e)
  }

  if (!profile) {
    profile = { image: getRandomDefaultImage(wallet) }
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
