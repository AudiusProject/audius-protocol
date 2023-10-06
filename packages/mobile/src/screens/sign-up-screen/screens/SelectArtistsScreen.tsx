import { useCallback, useState } from 'react'

import {
  useGetTopArtistsInGenre,
  type ID,
  useGetFeaturedArtists,
  Status
} from '@audius/common'
import { addFollowArtists } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { Formik } from 'formik'
import { Pressable, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Button, Text } from 'app/components/core'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  genresLabel: 'Selected genres',
  continue: 'Continue'
}

type SelectArtistsValues = {
  artists: ID[]
}

const initialValues: SelectArtistsValues = {
  artists: []
}

export const SelectArtistsScreen = () => {
  const genres = useSelector((state: any) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { artists } = values
      dispatch(addFollowArtists(artists))
    },
    [dispatch]
  )

  const isFeaturedArtists = currentGenre === 'Featured'

  const { data: topArtists, status: topArtistsStatus } =
    useGetTopArtistsInGenre(
      { genre: currentGenre },
      { disabled: isFeaturedArtists }
    )

  const { data: featuredArtists, status: featuredArtistsStatus } =
    useGetFeaturedArtists(undefined, {
      disabled: !isFeaturedArtists
    })

  const artists = isFeaturedArtists ? featuredArtists : topArtists
  const isLoading =
    (isFeaturedArtists ? topArtistsStatus : featuredArtistsStatus) ===
    Status.LOADING

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
      <Formik initialValues={initialValues} onSubmit={handleSubmit}>
        {({ values, setValues, handleSubmit }) => {
          const { artists: selectedArtists } = values
          return (
            <View>
              <View>
                {isLoading
                  ? null
                  : artists?.map((user) => {
                      const { user_id, name } = user
                      const checked = selectedArtists.includes(user_id)

                      const handleChange = () => {
                        const newArtists = checked
                          ? selectedArtists.filter((value) => value !== user_id)
                          : [user_id, ...selectedArtists]

                        setValues({ artists: newArtists })
                      }

                      return (
                        <Pressable
                          key={user_id}
                          testID={`artist-${name}`}
                          accessibilityRole='checkbox'
                          accessibilityState={{ checked }}
                          accessibilityLiveRegion='polite'
                          onPress={handleChange}
                          style={{
                            backgroundColor: checked ? 'purple' : undefined
                          }}
                        >
                          <Text>{name}</Text>
                        </Pressable>
                      )
                    })}
              </View>
              <Button
                title={messages.continue}
                onPress={() => handleSubmit()}
              />
            </View>
          )
        }}
      </Formik>
    </View>
  )
}
