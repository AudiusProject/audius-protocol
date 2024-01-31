import type { Remix } from '@audius/common/models'
import { StyleSheet, View } from 'react-native'

import Text from 'app/components/text'
import UserBadges from 'app/components/user-badges/UserBadges'
import { flexRowCentered } from 'app/styles'

import { useStyles as useTrackTileStyles } from './styles'

const messages = {
  coSign: 'Co-Sign',
  reposted: 'Reposted',
  favorited: 'Favorited',
  repostedAndFavorited: 'Reposted & Favorited'
}

const formatCoSign = ({
  hasReposted,
  hasFavorited
}: {
  hasReposted: boolean
  hasFavorited: boolean
}) => {
  if (hasReposted && hasFavorited) {
    return messages.repostedAndFavorited
  }
  if (hasFavorited) {
    return messages.favorited
  }
  return messages.reposted
}

const styles = StyleSheet.create({
  coSignText: {
    ...flexRowCentered(),
    justifyContent: 'flex-start',
    fontSize: 12,
    letterSpacing: 0.2,
    marginLeft: 10,
    marginTop: 8
  },
  coSignName: {
    ...flexRowCentered(),
    marginRight: 4
  },
  coSignIcon: {
    marginLeft: 4
  }
})

type Props = {
  coSign: Remix
}

export const LineupTileCoSign = ({ coSign }: Props) => {
  const trackTileStyles = useTrackTileStyles()
  return (
    <View style={styles.coSignText}>
      <View style={styles.coSignName}>
        <Text style={trackTileStyles.statText}>{coSign.user.name}</Text>
        <UserBadges
          user={coSign.user}
          style={styles.coSignIcon}
          badgeSize={8}
          hideName
        />
      </View>
      <Text style={trackTileStyles.statText}>
        {formatCoSign({
          hasReposted: coSign.has_remix_author_reposted,
          hasFavorited: coSign.has_remix_author_saved
        })}
      </Text>
    </View>
  )
}
