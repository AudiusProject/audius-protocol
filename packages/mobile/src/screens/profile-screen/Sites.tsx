import { User } from 'audius-client/src/common/models/User'
import { View, Text } from 'react-native'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import { Link } from 'app/components/core'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ spacing, palette }) => ({
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
    color: palette.neutral
  }
}))

type SitesProps = {
  profile: User
}

export const Sites = ({ profile }: SitesProps) => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  const { website, donation } = profile

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
