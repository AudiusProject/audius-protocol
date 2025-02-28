import { View } from 'react-native'

import { makeStyles } from 'app/styles'

import {
  DonationSocialLink,
  InstagramSocialLink,
  TikTokSocialLink,
  TwitterSocialLink,
  WebsiteSocialLink
} from './SocialLink'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  sites: {
    marginBottom: spacing(2),
    marginRight: spacing(6)
  },
  site: {
    marginTop: spacing(3)
  },
  siteText: {
    color: palette.neutral,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.medium,
    letterSpacing: 0.5
  }
}))

export const SocialsAndSites = () => {
  const styles = useStyles()

  return (
    <View pointerEvents='box-none' style={styles.sites}>
      <TwitterSocialLink showText style={styles.site} />
      <InstagramSocialLink showText style={styles.site} />
      <TikTokSocialLink showText style={styles.site} />
      <WebsiteSocialLink showText style={styles.site} />
      <DonationSocialLink showText style={styles.site} />
    </View>
  )
}
