import { ChangeEvent, useCallback, useState } from 'react'

import {
  ID,
  Status,
  useGetFeaturedArtists,
  useGetTopArtistsInGenre
} from '@audius/common'
import {
  Button,
  Flex,
  Text,
  IconArrowRight,
  PlainButton,
  PlainButtonType,
  SelectablePill,
  Paper
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { addFollowArtists } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { SIGN_UP_PASSWORD_PAGE, TRENDING_PAGE } from 'utils/route'

import { ContinueFooter } from '../components/ContinueFooter'
import FollowArtistTile from '../components/FollowArtistTile'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  genresLabel: 'Selected genres',
  continue: 'Continue',
  goBack: 'Go Back',
  pickArtists: (genre: string) => `Pick ${genre} Artists`
}

type SelectArtistsValues = {
  artists: ID[]
}

const initialValues: SelectArtistsValues = {
  artists: []
}

export const SelectArtistsPage = () => {
  // TODO: DO NOT MERGE
  // const genres = useSelector((state) => ['Featured', ...getGenres(state)])
  const genres = ['electronic', 'acoustic']
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()

  const handleChangeGenre = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { artists } = values
      dispatch(addFollowArtists(artists))
      // TODO: trigger CTA modal on trending page
      navigate(TRENDING_PAGE)
    },
    [dispatch, navigate]
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
    <Flex direction='column' gap='2xl'>
      <Flex direction='column' gap='2xl' mh='5xl'>
        <Flex direction='column' gap='l'>
          <Text variant='heading' size='l' strength='default'>
            {messages.header}
          </Text>
          <Text variant='body' size='l' strength='default'>
            {messages.description}
          </Text>
        </Flex>
        <Flex
          w='100%'
          direction='row'
          gap='s'
          justifyContent='center'
          role='radiogroup'
          aria-label={messages.genresLabel}
        >
          {genres.map((genre) => (
            // TODO: max of 6, kebab overflow
            <SelectablePill key={genre} label={genre} />
          ))}
        </Flex>
        <Formik initialValues={initialValues} onSubmit={handleSubmit}>
          {({ values, setValues }) => {
            const { artists: selectedArtists } = values
            const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
              const { checked, name } = e.target
              const userId = parseInt(name, 10)
              const newArtists = checked
                ? [userId, ...selectedArtists]
                : selectedArtists.filter((value) => value !== userId)

              setValues({ artists: newArtists })
            }
            return (
              <Form>
                <fieldset>
                  <Paper
                    css={{ background: 'var(--harmony-bg-default)' }}
                    shadow='none'
                    p='xl'
                    direction='row'
                    gap='m'
                    rowGap='m'
                    wrap='wrap'
                  >
                    {isLoading
                      ? null
                      : artists?.map((user) => {
                          return (
                            <FollowArtistTile key={user.user_id} user={user} />
                          )
                        })}
                  </Paper>
                </fieldset>
              </Form>
            )
          }}
        </Formik>
      </Flex>
    </Flex>
  )
}
