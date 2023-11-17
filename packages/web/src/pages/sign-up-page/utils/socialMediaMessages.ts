export const messages = {
  verificationError:
    'Something went wrong. Please try again or verify with another account.',
  socialMediaLoginSucess: (platform: 'twitter' | 'instagram' | 'tiktok') => {
    let platformName
    if (platform === 'twitter') {
      platformName = 'Twitter'
    } else if (platform === 'instagram') {
      platformName = 'Instagram'
    } else {
      platformName = 'TikTok'
    }
    return `${platformName} connection successful!`
  }
}
