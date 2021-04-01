import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TrendingTrack as TrendingNotification } from '../../../store/notifications/types'
import { useTheme } from '../../../utils/theme'
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
  notification: TrendingNotification
  onGoToRoute: (route: string) => void
}

const Trending = ({ notification, onGoToRoute }: TrendingProps) => {
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
        <Entity
          entity={entity}
          entityType={entityType}
          onGoToRoute={onGoToRoute}
        />
        {` is ${rank}${rankSuffix} on Trending Right Now! `}
      </Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default Trending
