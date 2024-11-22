import { SocialPlatform } from '~/models'
import { formatCapitalizeString } from '~/utils'

export const socialMediaMessages = {
  verificationError:
    'Something went wrong. Please try again or verify with another account.',
  accountInUseError: (platform: SocialPlatform) =>
    `An Audius account with that ${formatCapitalizeString(
      platform
    )} account already exists. Please sign in instead.`,
  socialMediaLoginSucess: (platform: SocialPlatform) => {
    const platformName = {
      twitter: 'Twitter',
      instagram: 'Instagram',
      tiktok: 'TikTok'
    }[platform]
    return `${platformName} connection successful!`
  },
  signUpTwitter: 'Sign up with Twitter',
  signUpInstagram: 'Sign up with Instagram',
  signUpTikTok: 'Sign up with TikTok'
}
