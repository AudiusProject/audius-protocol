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

const get3BoxUser = async (wallet: string) => {
  const threeBoxUser: IdxUser | null = await getLegacy3BoxProfileAsBasicProfile(
    wallet
  )
  if (threeBoxUser) {
    return transformIdxUser(threeBoxUser)
  }
  return null
}

export const getSelfIdProfile = async (wallet: Address): Promise<User> => {
  let profile: User | null = null

  try {
    profile = await getSelfIdUser(wallet)
    if (!profile) {
      profile = await get3BoxUser(wallet)
    }
  } catch (e) {
    profile = await get3BoxUser(wallet)
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
