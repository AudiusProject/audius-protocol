import { useCallback } from 'react'

import { useRemixContest, useTrack } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import type { ID } from '@audius/common/models'
import { formatContestDeadlineWithStatus } from '@audius/common/utils'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import {
  Divider,
  Flex,
  Paper,
  Text,
  type PaperProps
} from '@audius/harmony-native'
import type { AppTabScreenParamList } from 'app/screens/app-screen'

import { CollectionCardSkeleton } from '../collection-list/CollectionCardSkeleton'
import { TrackImage } from '../image/TrackImage'
import { UserLink } from '../user-link'

const messages = {
  deadline: (releaseDate?: string) =>
    releaseDate
      ? new Date(releaseDate) > new Date()
        ? formatContestDeadlineWithStatus(releaseDate, false)
        : 'Ended'
      : releaseDate
}

type RemixContestCardProps = PaperProps & {
  trackId: ID
  noNavigation?: boolean
}

type NavigationProp = NativeStackNavigationProp<AppTabScreenParamList>

export const RemixContestCard = (props: RemixContestCardProps) => {
  const { trackId } = props
  const { data: track } = useTrack(trackId)
  const { data: remixContest } = useRemixContest(trackId)
  const navigation = useNavigation<NavigationProp>()
  const handlePress = useCallback(() => {
    navigation.navigate('Track', { trackId })
  }, [navigation, trackId])

  if (!track || !remixContest) {
    return <CollectionCardSkeleton />
  }
  return (
    <Paper border='default' onPress={handlePress}>
      <Flex p='s' gap='s'>
        <TrackImage trackId={trackId} size={SquareSizes.SIZE_480_BY_480} />
        <Text variant='title' textAlign='center' numberOfLines={1}>
          {track.title}
        </Text>

        <UserLink
          userId={track.owner_id}
          textAlign='center'
          style={{ justifyContent: 'center' }}
        />
      </Flex>
      <Divider orientation='horizontal' />
      <Flex
        direction='row'
        gap='l'
        pv='s'
        justifyContent='center'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        <Text strength='strong' size='s' color='subdued'>
          {messages.deadline(remixContest.endDate)}
        </Text>
      </Flex>
    </Paper>
  )
}
