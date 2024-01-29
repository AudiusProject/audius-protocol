import { View, Text } from 'react-native'

import { IconDonate } from '@audius/harmony-native'
import { IconLink } from '@audius/harmony-native'
import { Link } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from './selectors'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  sites: {
    marginBottom: spacing(2)
  },
  siteIcon: {
    marginRight: spacing(2)
  },
  site: {
    // Flex start so the bounding box around the button is not full-width
    alignSelf: 'flex-start',
    display: 'flex',
    flexDirection: 'row',
    marginTop: spacing(3)
  },
  siteText: {
    color: palette.neutral,
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontByWeight.medium,
    letterSpacing: 0.5
  }
}))

const prependProtocol = (url?: string) =>
  !url?.match(/^https?:\/\//i) ? `https://${url}` : url

export const Sites = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { website, donation } = useSelectProfile(['website', 'donation'])
  const iconProps = {
    height: 20,
    width: 20,
    fill: neutral,
    style: styles.siteIcon
  }

  return (
    <View pointerEvents='box-none' style={styles.sites}>
      {website ? (
        <Link style={styles.site} url={prependProtocol(website)}>
          <IconLink {...iconProps} />
          <Text style={styles.siteText}>{website}</Text>
        </Link>
      ) : null}
      {donation ? (
        <Link style={styles.site} url={prependProtocol(donation)}>
          <IconDonate {...iconProps} />
          <Text style={styles.siteText}>{donation}</Text>
        </Link>
      ) : null}
    </View>
  )
}
