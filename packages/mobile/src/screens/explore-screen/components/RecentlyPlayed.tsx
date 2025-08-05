import React from 'react'

import { useRecentlyPlayedTracks } from '@audius/common/api'
import { exploreMessages as messages } from '@audius/common/messages'
import { ScrollView } from 'react-native'

import { Flex, useTheme } from '@audius/harmony-native'
import { TrackCard } from 'app/components/track/TrackCard'

import { ExploreSection } from './ExploreSection'

export const RecentlyPlayedTracks = () => {
  const { spacing } = useTheme()
  const { data: recentlyPlayedTracks, isLoading } = useRecentlyPlayedTracks({
    pageSize: 10
  })

  if (!recentlyPlayedTracks || recentlyPlayedTracks.length === 0) {
    return null
  }
  return (
    <ExploreSection
      title={messages.recentlyPlayed}
      isLoading={isLoading}
      viewAllLink='ListeningHistoryScreen'
    >
      <Flex mh={-16}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: spacing.m,
            paddingHorizontal: 16
          }}
        >
          {recentlyPlayedTracks?.map((trackId) => (
            <Flex key={trackId} w={160}>
              <TrackCard id={trackId} />
            </Flex>
          ))}
        </ScrollView>
      </Flex>
    </ExploreSection>
  )
}
