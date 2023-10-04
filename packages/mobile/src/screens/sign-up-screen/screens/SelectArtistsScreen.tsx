import { useState } from 'react'

import { getGenres } from 'audius-client/src/common/store/pages/signon/selectors'
import { Pressable, View } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  continue: 'Continue'
}

export const SelectArtistsScreen = () => {
  const genres = useSelector((state: any) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')

  return (
    <View>
      <View>
        <Text>{messages.header}</Text>
        <Text>{messages.description}</Text>
      </View>
      <View accessibilityRole='radiogroup'>
        {genres.map((genre) => {
          const checked = genre === currentGenre
          return (
            <Pressable
              key={genre}
              testID={genre}
              accessibilityRole='radio'
              accessibilityState={{ checked }}
              accessibilityLiveRegion='polite'
              onPress={() => setCurrentGenre(genre)}
              style={{ backgroundColor: checked ? 'purple' : undefined }}
            >
              <Text>{genre}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
