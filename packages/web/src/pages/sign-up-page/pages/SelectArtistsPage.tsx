import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'

import {
  Genre,
  Status,
  convertGenreLabelToValue,
  useGetFeaturedArtists,
  useGetTopArtistsInGenre,
  selectArtistsSchema
} from '@audius/common'
import { selectArtistsPageMessages } from '@audius/common/messages'
import { Flex, Text, SelectablePill, Paper, useTheme } from '@audius/harmony'
import { useSpring, animated } from '@react-spring/web'
import { Form, Formik } from 'formik'
import { range } from 'lodash'
import { useDispatch } from 'react-redux'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import {
  addFollowArtists,
  completeFollowArtists
} from 'common/store/pages/signon/actions'
import { getGenres } from 'common/store/pages/signon/selectors'
import { useMedia } from 'hooks/useMedia'
import { useNavigateToPage } from 'hooks/useNavigateToPage'
import { useSelector } from 'utils/reducer'
import { SIGN_UP_APP_CTA_PAGE, SIGN_UP_COMPLETED_REDIRECT } from 'utils/route'

import { AccountHeader } from '../components/AccountHeader'
import {
  FollowArtistCard,
  FollowArtistTileSkeleton
} from '../components/FollowArtistCard'
import { PreviewArtistHint } from '../components/PreviewArtistHint'
import {
  Heading,
  HiddenLegend,
  PageFooter,
  ScrollView
} from '../components/layout'
import { SelectArtistsPreviewContextProvider } from '../utils/selectArtistsPreviewContext'

const AnimatedFlex = animated(Flex)

type SelectArtistsValues = {
  selectedArtists: string[]
}

const initialValues: SelectArtistsValues = {
  selectedArtists: []
}

const ARTISTS_PER_GENRE_LIMIT = 31

export const SelectArtistsPage = () => {
  const artistGenres = useSelector((state) => ['Featured', ...getGenres(state)])
  const [currentGenre, setCurrentGenre] = useState('Featured')
  const dispatch = useDispatch()
  const navigate = useNavigateToPage()
  const { color } = useTheme()
  const headerContainerRef = useRef<HTMLDivElement | null>(null)
  const { isMobile } = useMedia()

  const handleChangeGenre = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentGenre(e.target.value)
  }, [])

  const handleSubmit = useCallback(
    (values: SelectArtistsValues) => {
      const { selectedArtists } = values
      const artistsIDArray = [...selectedArtists].map((a) => Number(a))
      dispatch(addFollowArtists(artistsIDArray))
      dispatch(completeFollowArtists())
      if (isMobile) {
        navigate(SIGN_UP_COMPLETED_REDIRECT)
      } else {
        navigate(SIGN_UP_APP_CTA_PAGE)
      }
    },
    [dispatch, isMobile, navigate]
  )

  const isFeaturedArtists = currentGenre === 'Featured'

  const { data: topArtists, status: topArtistsStatus } =
    useGetTopArtistsInGenre(
      { genre: currentGenre, limit: ARTISTS_PER_GENRE_LIMIT },
      { disabled: isFeaturedArtists }
    )

  const { data: featuredArtists, status: featuredArtistsStatus } =
    useGetFeaturedArtists(undefined, {
      disabled: !isFeaturedArtists
    })

  const artists = isFeaturedArtists ? featuredArtists : topArtists
  const isLoading =
    (isFeaturedArtists ? featuredArtistsStatus : topArtistsStatus) ===
    Status.LOADING

  const ArtistsList = isMobile ? Flex : Paper

  const styles = useSpring({
    from: {
      opacity: 0,
      transform: 'translateX(100%)'
    },
    to: {
      opacity: 1,
      transform: 'translateX(0%)'
    }
  })

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={toFormikValidationSchema(selectArtistsSchema)}
    >
      {({ values, isValid, isSubmitting, isValidating, dirty }) => {
        const { selectedArtists } = values
        return (
          <ScrollView as={Form} gap={isMobile ? undefined : '3xl'}>
            <AccountHeader
              mode='viewing'
              backButtonText={
                isMobile ? undefined : selectArtistsPageMessages.backToGenres
              }
            />
            <AnimatedFlex
              direction='column'
              mh={isMobile ? undefined : '5xl'}
              mb={isMobile ? undefined : 'xl'}
              style={styles}
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
                <Heading
                  ref={headerContainerRef}
                  ph={isMobile ? 'l' : undefined}
                  heading={selectArtistsPageMessages.header}
                  description={selectArtistsPageMessages.description}
                  centered={!isMobile}
                />
                <ScrollView
                  orientation='horizontal'
                  w='100%'
                  gap='s'
                  ph={isMobile ? 'l' : undefined}
                  justifyContent={isMobile ? 'flex-start' : 'center'}
                  role='radiogroup'
                  onChange={handleChangeGenre}
                  aria-label={selectArtistsPageMessages.genresLabel}
                  disableScroll={!isMobile}
                >
                  {artistGenres.map((genre) => (
                    // TODO: max of 6, kebab overflow
                    <SelectablePill
                      key={genre}
                      type='radio'
                      name='genre'
                      label={convertGenreLabelToValue(genre as Genre)}
                      size={isMobile ? 'small' : 'large'}
                      value={genre}
                      isSelected={currentGenre === genre}
                    />
                  ))}
                </ScrollView>
              </Flex>
              <SelectArtistsPreviewContextProvider>
                <ArtistsList
                  as='fieldset'
                  backgroundColor='default'
                  pv='xl'
                  ph={isMobile ? 'l' : 'xl'}
                  css={{
                    minHeight: 500,
                    minWidth: !isMobile ? 530 : undefined
                  }}
                  direction='column'
                >
                  <HiddenLegend>
                    {selectArtistsPageMessages.pickArtists(currentGenre)}
                  </HiddenLegend>

                  {isLoading || !isMobile ? null : <PreviewArtistHint />}
                  <Flex
                    gap={isMobile ? 's' : 'm'}
                    wrap='wrap'
                    justifyContent='center'
                  >
                    {isLoading
                      ? range(9).map((index) => (
                          <FollowArtistTileSkeleton key={index} />
                        ))
                      : artists?.map((user) => (
                          <FollowArtistCard key={user.user_id} user={user} />
                        ))}
                  </Flex>
                </ArtistsList>
              </SelectArtistsPreviewContextProvider>
            </AnimatedFlex>
            <PageFooter
              centered
              sticky
              buttonProps={{
                disabled: !dirty || !isValid || isSubmitting,
                isLoading: isSubmitting || isValidating
              }}
              postfix={
                <Text variant='body'>
                  {selectArtistsPageMessages.selected}{' '}
                  {selectedArtists.length || 0}/3
                </Text>
              }
            />
          </ScrollView>
        )
      }}
    </Formik>
  )
}
