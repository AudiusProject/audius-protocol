import { Address } from 'types'
import { TIMED_OUT_ERROR, withTimeout } from 'utils/fetch'
import { getRandomDefaultImage } from 'utils/identicon'
import { getProfile } from '3box/lib/api'

const ipfsGateway = 'https://ipfs.infura.io/ipfs/'

type User = {
  status?: string
  name?: string
  image: string
}

type UserWithCache = User & {
  noCache?: boolean
}

export const get3BoxProfile = async (
  wallet: Address
): Promise<UserWithCache> => {
  const image = getRandomDefaultImage(wallet)
  try {
    const user: User = { image }

    // Get the profile from 3box
    const profile = (await withTimeout(getProfile(wallet), 3000)) as User
    if (profile.status === 'error') return user

    // Extract the name and image url
    if ('name' in profile) user.name = profile.name
    if (Array.isArray(profile.image) && profile.image.length > 0) {
      const [firstImage] = profile.image
      if ('contentUrl' in firstImage && '/' in firstImage.contentUrl) {
        const hash = firstImage.contentUrl['/']
        user.image = `${ipfsGateway}${hash}`
      }
    }

    // return the user
    return user
  } catch (err) {
    if (err.message.includes(TIMED_OUT_ERROR)) {
      // Response timed out - do not cache response
      return { image, noCache: true }
    }
    return { image }
  }
}

// NOTE: Look into storing the profiles in localstorage or indexdb.
const cache3box: {
  [address: string]: User
} = {}

export const getUserProfile = async (wallet: string): Promise<User> => {
  if (wallet in cache3box) return cache3box[wallet]
  const profile = await get3BoxProfile(wallet)
  if (!profile.noCache) cache3box[wallet] = profile
  return {
    name: profile.name || wallet,
    image: profile.image
  }
}

export default getUserProfile
