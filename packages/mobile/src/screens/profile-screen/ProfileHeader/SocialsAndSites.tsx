import { View } from 'react-native'

import { IconDonate } from '@audius/harmony-native'
import { IconLink } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import { useSelectProfile } from '../selectors'

import {
  InstagramSocialLink,
  SocialLink,
  TikTokSocialLink,
  TwitterSocialLink
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

// adds https to urls that don't include http protocol
const prependProtocol = (url?: string) =>
  !url?.match(/^https?:\/\//i) ? `https://${url}` : url

export const SocialsAndSites = () => {
  const styles = useStyles()
  const { website, donation } = useSelectProfile(['website', 'donation'])

  return (
    <View pointerEvents='box-none' style={styles.sites}>
      <TwitterSocialLink showText style={styles.site} />
      <InstagramSocialLink showText style={styles.site} />
      <TikTokSocialLink showText style={styles.site} />
      <SocialLink
        url={prependProtocol(website)}
        text={website}
        icon={IconLink}
        showText
        style={styles.site}
        hyperlink
      />
      <SocialLink
        url={prependProtocol(donation)}
        text={donation}
        icon={IconDonate}
        showText
        style={styles.site}
        hyperlink
      />
    </View>
  )
}
