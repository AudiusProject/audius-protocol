import { View } from 'react-native'

import { IconTipping } from '@audius/harmony-native'
import { Divider, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

import { Bio } from './Bio'
import { ProfileInfoTiles } from './ProfileInfoTiles'
import { ProfileTierTile } from './ProfileTierTile'
import { SocialsAndSites } from './SocialsAndSites'
import { SupportingList } from './SupportingList'

const messages = {
  supporting: 'Supporting'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: spacing(3)
  },
  divider: {
    marginLeft: spacing(3),
    flex: 1
  },
  text: {
    ...typography.h3,
    color: palette.neutral
  },
  icon: {
    marginRight: spacing(1.5),
    position: 'relative',
    bottom: 2
  },
  buttonRow: {
    flexDirection: 'row',
    marginVertical: spacing(2),
    gap: spacing(2)
  },
  audioTier: {
    margin: spacing(2)
  }
}))

const SupportingSectionTitle = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  return (
    <View style={styles.titleContainer}>
      <IconTipping height={18} width={18} fill={neutral} style={styles.icon} />
      <Text style={styles.text}>{messages.supporting}</Text>
      <Divider style={styles.divider} />
    </View>
  )
}

export const ExpandedSection = () => {
  const styles = useStyles()
  const { supporting_count } = useSelectProfile(['supporting_count'])

  return (
    <View pointerEvents='box-none'>
      <Bio />
      <ProfileTierTile interactive={false} style={styles.audioTier} />
      <SocialsAndSites />
      <ProfileInfoTiles />
      {supporting_count > 0 ? (
        <>
          <SupportingSectionTitle />
          <SupportingList />
        </>
      ) : null}
    </View>
  )
}
