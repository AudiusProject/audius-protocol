export const socialMediaMessages = {
  verificationError:
    'Something went wrong. Please try again or verify with another account.',
  socialMediaLoginSucess: (platform: 'twitter' | 'instagram' | 'tiktok') => {
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
