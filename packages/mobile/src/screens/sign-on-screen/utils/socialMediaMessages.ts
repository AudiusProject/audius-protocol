import type { SocialPlatform } from '@audius/common/models'

export const socialMediaMessages = {
  verificationError:
    'Something went wrong. Please try again or verify with another account.',
  socialMediaLoginSucess: (platform: SocialPlatform) => {
    const platformName = {
      x: 'X',
      instagram: 'Instagram',
      tiktok: 'TikTok'
    }[platform]
    return `${platformName} connection successful!`
  },
  signUpX: 'Sign up with X',
  signUpInstagram: 'Sign up with Instagram',
  signUpTikTok: 'Sign up with TikTok'
}
