import { Flex } from '@audius/harmony-native'

import {
  DonationSocialLink,
  InstagramSocialLink,
  TikTokSocialLink,
  TwitterSocialLink,
  WebsiteSocialLink
} from './SocialLink'

export const SocialsAndSites = () => {
  return (
    <Flex pointerEvents='box-none' gap='m'>
      <TwitterSocialLink showText />
      <InstagramSocialLink showText />
      <TikTokSocialLink showText />
      <WebsiteSocialLink showText />
      <DonationSocialLink showText />
    </Flex>
  )
}
