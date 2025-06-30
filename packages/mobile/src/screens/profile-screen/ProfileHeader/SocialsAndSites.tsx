import { Flex } from '@audius/harmony-native'

import {
  DonationSocialLink,
  InstagramSocialLink,
  TikTokSocialLink,
  XSocialLink,
  WebsiteSocialLink
} from './SocialLink'

export const SocialsAndSites = () => {
  return (
    <Flex pointerEvents='box-none' gap='m'>
      <XSocialLink showText />
      <InstagramSocialLink showText />
      <TikTokSocialLink showText />
      <WebsiteSocialLink showText />
      <DonationSocialLink showText />
    </Flex>
  )
}
