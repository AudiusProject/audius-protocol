import { ProfileUser } from 'audius-client/src/common/store/pages/profile/types'
import { View, Text } from 'react-native'

import {
  getAudioTierRank,
  getUserAudioTier,
  IconAudioBadge
} from 'app/components/audio-rewards'
import { Tile } from 'app/components/core'
import { makeStyles } from 'app/styles/makeStyles'

const messages = {
  tier: 'tier'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    width: 208,
    height: 56,
    marginRight: spacing(8)
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing(2)
  },
  badge: {
    marginRight: spacing(3)
  },
  tierNumber: {
    fontSize: 16,
    fontFamily: typography.fontByWeight.bold,
    textTransform: 'uppercase',
    color: palette.neutralLight6
  },
  tierText: {
    fontSize: 22,
    fontFamily: typography.fontByWeight.heavy,
    textTransform: 'uppercase',
    color: palette.neutralLight3
  }
}))

type ProfileBadgeProps = {
  profile: ProfileUser
}

export const ProfileBadge = ({ profile }: ProfileBadgeProps) => {
  const styles = useStyles()
  const tier = getUserAudioTier(profile)
  const tierRank = getAudioTierRank(tier)

  if (tier === 'none') return null

  return (
    <Tile styles={{ root: styles.root, content: styles.content }}>
      <IconAudioBadge tier={tier} height={28} width={28} style={styles.badge} />
      <View>
        <Text style={styles.tierNumber}>
          {messages.tier} {tierRank}
        </Text>
        <Text style={styles.tierText}>{tier}</Text>
      </View>
    </Tile>
  )
}
