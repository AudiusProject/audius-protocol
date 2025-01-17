import { useTopArtists } from '@audius/common/api'
import type { UserMetadata } from '@audius/common/models'
import type { Genre } from '@audius/common/utils'
import { convertGenreLabelToValue } from '@audius/common/utils'
import { css } from '@emotion/native'
import { useIsFocused, type RouteProp } from '@react-navigation/native'

import { Box, useTheme } from '@audius/harmony-native'
import { CardList } from 'app/components/core'

import { FollowArtistCard, FollowArtistTileSkeleton } from './FollowArtistCard'
import { PreviewArtistHint } from './PreviewArtistHint'

type Props = {
  route: RouteProp<any>
}

export const TopArtistsCardList = (props: Props) => {
  const { name: genre } = props.route
  const { spacing } = useTheme()
  const isFocused = useIsFocused()
  const { data: artists } = useTopArtists(
    convertGenreLabelToValue(genre as Genre),
    { enabled: isFocused }
  )

  return (
    <CardList
      ListHeaderComponent={genre === 'Featured' ? <PreviewArtistHint /> : null}
      data={artists as UserMetadata[]}
      style={css({ paddingTop: spacing.xl })}
      renderItem={({ item, index }) => (
        <FollowArtistCard
          artist={item}
          showPreviewHint={genre === 'Featured' && index === 0}
        />
      )}
      sceneName={genre}
      numColumns={2}
      // TODO: Figure out sticky header and footers
      ListFooterComponent={<Box h={148} />}
      LoadingCardComponent={FollowArtistTileSkeleton}
    />
  )
}
