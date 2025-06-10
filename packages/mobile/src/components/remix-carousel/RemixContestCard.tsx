import { useCallback } from 'react'

import { useRemixContest } from '@audius/common/api'
import { SquareSizes } from '@audius/common/models'
import type { TrackMetadata } from '@audius/common/models'
import { formatDate } from '@audius/common/utils'
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

import { TrackImage } from '../image/TrackImage'
import { UserLink } from '../user-link'

const messages = {
  deadline: (releaseDate?: string) =>
    releaseDate
      ? new Date(releaseDate) > new Date()
        ? `Deadline: ${formatDate(releaseDate)}`
        : 'Ended'
      : releaseDate
}

type RemixContestCardProps = PaperProps & {
  track: TrackMetadata
  noNavigation?: boolean
}

type NavigationProp = NativeStackNavigationProp<AppTabScreenParamList>

export const RemixContestCard = (props: RemixContestCardProps) => {
  const { track } = props
  const { data: remixContest } = useRemixContest(track?.track_id)
  const navigation = useNavigation<NavigationProp>()
  const handlePress = useCallback(() => {
    navigation.navigate('Track', { trackId: track?.track_id })
  }, [navigation, track?.track_id])

  return (
    <Paper onPress={handlePress}>
      <Flex p='s' gap='s'>
        <TrackImage
          trackId={track?.track_id}
          size={SquareSizes.SIZE_480_BY_480}
        />
        <Text variant='title' textAlign='center' numberOfLines={1}>
          {track?.title}
        </Text>

        <UserLink
          userId={track?.owner_id}
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
          {messages.deadline(remixContest?.endDate)}
        </Text>
      </Flex>
    </Paper>
  )
}
