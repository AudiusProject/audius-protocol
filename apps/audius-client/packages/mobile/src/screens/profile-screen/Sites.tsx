import { ProfileUser } from 'audius-client/src/pages/profile-page/store/types'
import { View, Text } from 'react-native'

import IconDonate from 'app/assets/images/iconDonate.svg'
import IconLink from 'app/assets/images/iconLink.svg'
import { makeStyles } from 'app/styles/makeStyles'
import { useThemeColors } from 'app/utils/theme'

type SitesProps = {
  profile: ProfileUser
}

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
        <View style={styles.site}>
          <IconLink {...iconProps} />
          <Text style={styles.siteText}>{website}</Text>
        </View>
      ) : null}
      {donation ? (
        <View style={styles.site}>
          <IconDonate {...iconProps} />
          <Text style={styles.siteText}>{donation}</Text>
        </View>
      ) : null}
    </View>
  )
}
