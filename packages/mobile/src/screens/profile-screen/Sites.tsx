import { View, Text } from 'react-native'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import { Link } from 'app/components/core'
import { makeStyles } from 'app/styles/makeStyles'
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
    <View style={styles.sites}>
      {website ? (
        <Link style={styles.site} url={website}>
          <IconLink {...iconProps} />
          <Text style={styles.siteText}>{website}</Text>
        </Link>
      ) : null}
      {donation ? (
        <Link style={styles.site} url={donation}>
          <IconDonate {...iconProps} />
          <Text style={styles.siteText}>{donation}</Text>
        </Link>
      ) : null}
    </View>
  )
}
