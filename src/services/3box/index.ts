import { Address } from 'types'

const api3Box = 'https://ipfs.3box.io'
const ipfsGateway = 'https://ipfs.infura.io/ipfs/'
const getProfileUrl = (wallet: string) => `${api3Box}/profile?wallet=${wallet}`

type User = {
  name?: string
  image?: string
}

export const get3BoxProfile = async (wallet: Address) => {
  try {
    const user: User = {}

    // Get the profile from 3box
    const profile = await fetch(getProfileUrl(wallet)).then(r => r.json())
    if (profile.status === 'error') return {}

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
    console.log(err)
    return {}
  }
}

export const getUserProfile = async (wallet: string) => {
  const profile = await get3BoxProfile(wallet)
  return profile
}

export default getUserProfile
