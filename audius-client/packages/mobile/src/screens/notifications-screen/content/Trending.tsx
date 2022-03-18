import { TrendingTrack } from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from 'app/utils/theme'

import Entity from './Entity'
import TwitterShare from './TwitterShare'

export const getRankSuffix = (rank: number) => {
  if (rank === 1) return 'st'
  if (rank === 2) return 'nd'
  if (rank === 3) return 'rd'
  return 'th'
}

const styles = StyleSheet.create({
  textWrapper: {
    fontFamily: 'AvenirNextLTPro-Medium',
    fontSize: 16,
    marginBottom: 8
  }
})

type TrendingProps = {
  notification: TrendingTrack
}

const Trending = ({ notification }: TrendingProps) => {
  const entityType = notification.entityType
  const { rank, entity } = notification
  const rankSuffix = getRankSuffix(rank)

  const textWrapperStyle = useTheme(styles.textWrapper, {
    color: 'neutral'
  })

  return (
    <View>
      <Text style={textWrapperStyle}>
        {`Your track `}
        <Entity entity={entity} entityType={entityType} />
        {` is ${rank}${rankSuffix} on Trending Right Now! `}
      </Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Trending
