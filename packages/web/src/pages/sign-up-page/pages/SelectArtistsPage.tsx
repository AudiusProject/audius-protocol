import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

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
  SelectablePill,
  Paper,
  useTheme
} from '@audius/harmony'
import { Form, Formik } from 'formik'
import { useDispatch } from 'react-redux'
import { z } from 'zod'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { useModalState } from 'common/hooks/useModalState'
import { addFollowArtists } from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { TRENDING_PAGE } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import { ContinueFooter } from '../components/ContinueFooter'
import FollowArtistTile from '../components/FollowArtistTile'
import { PreviewArtistToast } from '../components/PreviewArtistToast'
import { SelectArtistsPreviewContextProvider } from '../utils/selectArtistsPreviewContext'

const messages = {
  header: 'Follow At Least 3 Artists',
  description:
    'Curate your feed with tracks uploaded or reposted by anyone you follow. Click the artist’s photo to preview their music.',
  genresLabel: 'Genre',
  continue: 'Continue',
  goBack: 'Go Back',
  pickArtists: (genre: string) => `Pick ${genre} Artists`
}

type SelectArtistsValues = {
  selectedArtists: ID[]
}

const initialValues: SelectArtistsValues = {
  selectedArtists: []
}

const SelectArtistsFormSchema = z.object({
  selectedArtists: z.array(z.string()).min(3)
})

export const SelectArtistsPage = () => {
  const genres = useSelector((state) => ['Featured', ...getGenres(state)])
  const [, setIsWelcomeModalOpen] = useModalState('Welcome')
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { color } = useTheme()
  const headerContainerRef = useRef<HTMLDivElement | null>(null)

  const handleChangeGenre = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { selectedArtists } = values
      dispatch(addFollowArtists([...selectedArtists]))
      navigate(TRENDING_PAGE)
      setIsWelcomeModalOpen(true)
    },
    [dispatch, navigate, setIsWelcomeModalOpen]
  )

  const isFeaturedArtists = currentGenre === 'Featured'

  const { data: topArtists, status: topArtistsStatus } =
    useGetTopArtistsInGenre(
      { genre: currentGenre },
      { disabled: isFeaturedArtists }
    )

  const { isMobile } = useMedia()
  const { data: featuredArtists, status: featuredArtistsStatus } =
    useGetFeaturedArtists(undefined, {
      disabled: !isFeaturedArtists
    })

  const artists = isFeaturedArtists ? featuredArtists : topArtists
  const isLoading =
    (isFeaturedArtists ? topArtistsStatus : featuredArtistsStatus) ===
    Status.LOADING

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(SelectArtistsFormSchema)}
    >
      {({ values, isValid, isSubmitting, isValidating, dirty }) => {
        const { selectedArtists } = values
        return (
          <Flex
            as={Form}
            direction='column'
            gap={isMobile ? undefined : '3xl'}
            css={{
              width: '100%',
              overflow: 'auto',
              // Hide scrollbar
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE + Edge
              // Chrome + Safari
              '::-webkit-scrollbar': {
                display: 'none'
              }
            }}
          >
            <AccountHeader mode='viewing' />
            <Flex
              direction='column'
              mh={isMobile ? undefined : '5xl'}
              mb={isMobile ? undefined : 'xl'}
            >
              <Flex
                direction='column'
                gap='xl'
                pt={isMobile ? '2xl' : undefined}
                pb='xl'
                shadow={isMobile ? 'mid' : undefined}
                css={{
                  ...(isMobile && {
                    zIndex: 2,
                    backgroundColor: color.background.white,
                    position: 'sticky',
                    top: headerContainerRef?.current
                      ? -(32 + headerContainerRef.current.clientHeight)
                      : undefined
                  })
                }}
              >
                <Flex
                  direction='column'
                  gap={isMobile ? 's' : 'l'}
                  ph={isMobile ? 'l' : undefined}
                  ref={headerContainerRef}
                >
                  <Text
                    variant='heading'
                    size={isMobile ? 'm' : 'l'}
                    strength='default'
                    color='accent'
                  >
                    {messages.header}
                  </Text>
                  <Text
                    variant='body'
                    size={isMobile ? 'm' : 'l'}
                    strength='default'
                  >
                    {messages.description}
                  </Text>
                </Flex>
                <Flex
                  w='100%'
                  gap='s'
                  ph={isMobile ? 'l' : undefined}
                  justifyContent={isMobile ? 'flex-start' : 'center'}
                  role='radiogroup'
                  onChange={handleChangeGenre}
                  css={{
                    ...(isMobile && {
                      overflow: 'auto',
                      // Hide scrollbar
                      scrollbarWidth: 'none', // Firefox
                      msOverflowStyle: 'none', // IE + Edge
                      // Chrome + Safari
                      '::-webkit-scrollbar': {
                        display: 'none'
                      }
                    })
                  }}
                  aria-label={messages.genresLabel}
                >
                  {genres.map((genre) => (
                    // TODO: max of 6, kebab overflow
                    <SelectablePill
                      type='radio'
                      name='genre'
                      key={genre}
                      label={genre}
                      size={isMobile ? 'small' : 'large'}
                      isSelected={currentGenre === genre}
                    />
                  ))}
                </Flex>
              </Flex>
              <fieldset>
                <SelectArtistsPreviewContextProvider>
                  <Paper
                    backgroundColor='default'
                    pv='xl'
                    ph={isMobile ? 'l' : 'xl'}
                    css={{ minHeight: 500 }}
                    direction='column'
                  >
                    {isLoading || !isMobile ? null : <PreviewArtistToast />}
                    <Flex
                      gap={isMobile ? 's' : 'm'}
                      wrap='wrap'
                      justifyContent='center'
                    >
                      {isLoading ? (
                        <LoadingSpinner />
                      ) : (
                        artists?.map((user) => (
                          <FollowArtistTile key={user.user_id} user={user} />
                        ))
                      )}
                    </Flex>
                  </Paper>
                </SelectArtistsPreviewContextProvider>
              </fieldset>
            </Flex>
            <ContinueFooter sticky>
              <Button
                type='submit'
                disabled={!dirty || !isValid || isSubmitting}
                isLoading={isSubmitting || isValidating}
                iconRight={IconArrowRight}
                fullWidth={isMobile}
              >
                {messages.continue}
              </Button>
              <Text variant='body'>
                Selected {selectedArtists.length || 0}/3
              </Text>
            </ContinueFooter>
          </Flex>
        )
      }}
    </Formik>
  )
}
