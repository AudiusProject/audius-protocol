import { memo } from 'react'

import type { QueryHookOptions } from '@audius/common'
import { useGetFeaturedArtists, useGetTopArtistsInGenre } from '@audius/common'
import { css } from '@emotion/native'
import { useIsFocused, type RouteProp } from '@react-navigation/native'

import { Box, useTheme } from '@audius/harmony-native'
import { CardList } from 'app/components/core'

import {
  FollowArtistField,
  FollowArtistTileSkeleton
} from './FollowArtistField'

export const useGetTopArtists = (genre: string, options?: QueryHookOptions) => {
  const useGetArtistsHook =
    genre === 'Featured' ? useGetFeaturedArtists : useGetTopArtistsInGenre

  return useGetArtistsHook({ genre }, options)
}

const MemoizedFollowArtistField = memo(FollowArtistField)

type Props = {
  route: RouteProp<any>
}

export const TopArtistsCardList = (props: Props) => {
  const { name: genre } = props.route
  const isFocused = useIsFocused()
  const { spacing } = useTheme()

  const { data: artists } = useGetTopArtists(genre, {
    disabled: !isFocused
  })

  return (
    <CardList
      data={artists}
      style={css({ paddingTop: spacing.xl })}
      renderItem={({ item }) => <MemoizedFollowArtistField artist={item} />}
      sceneName={genre}
      numColumns={2}
      ListFooterComponent={<Box h={140} />}
      LoadingCardComponent={FollowArtistTileSkeleton}
    />
  )
}
