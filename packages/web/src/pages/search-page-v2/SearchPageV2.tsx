import { ChangeEvent, useCallback, useContext, useEffect } from 'react'

import { Status } from '@audius/common/models'
import { Maybe } from '@audius/common/utils'
import {
  Flex,
  IconAlbum,
  IconComponent,
  IconNote,
  IconPlaylists,
  IconUser,
  LoadingSpinner,
  RadioGroup,
  SelectablePill,
  Text
} from '@audius/harmony'
import { capitalize } from 'lodash'
import { useParams } from 'react-router-dom'

import { useHistoryContext } from 'app/HistoryProvider'
import Header from 'components/header/desktop/Header'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import NavContext, {
  CenterPreset,
  LeftPreset,
  RightPreset
} from 'components/nav/mobile/NavContext'
import Page from 'components/page/Page'
import { useMedia } from 'hooks/useMedia'

import { SearchCatalogTile } from './SearchCatalogTile'

type Filter =
  | 'genre'
  | 'mood'
  | 'key'
  | 'bpm'
  | 'isPremium'
  | 'hasDownloads'
  | 'isVerified'

type Category = {
  filters: Filter[]
  icon?: IconComponent
}

const categories = {
  all: { filters: [] },
  profiles: { icon: IconUser, filters: ['genre', 'isVerified'] },
  tracks: {
    icon: IconNote,
    filters: ['genre', 'mood', 'key', 'bpm', 'isPremium', 'hasDownloads']
  },
  albums: { icon: IconAlbum, filters: ['genre', 'mood'] },
  playlists: { icon: IconPlaylists, filters: ['genre', 'mood'] }
} satisfies Record<string, Category>

type CategoryKey = keyof typeof categories

type SearchHeaderProps = {
  category?: CategoryKey
  setCategory: (category: CategoryKey) => void
  title: string
  query: Maybe<string>
}

const SearchHeader = (props: SearchHeaderProps) => {
  const { category: categoryKey = 'all', setCategory, query, title } = props

  const { isMobile } = useMedia()

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  const categoryRadioGroup = (
    <RadioGroup
      direction='row'
      gap='s'
      aria-label={'Select search category'}
      name='searchcategory'
      value={categoryKey}
      onChange={handleChange}
    >
      {Object.entries(categories)
        .filter(([key]) => !isMobile || key !== 'all')
        .map(([key, category]) => (
          <SelectablePill
            aria-label={`${key} search category`}
            icon={(category as Category).icon}
            key={key}
            label={capitalize(key)}
            size='large'
            type='radio'
            value={key}
            checked={key === categoryKey}
          />
        ))}
    </RadioGroup>
  )

  return isMobile ? (
    <Flex p='s' css={{ overflow: 'scroll' }}>
      {categoryRadioGroup}
    </Flex>
  ) : (
    <Header
      {...props}
      primary={title}
      secondary={
        query ? (
          <Flex ml='l'>
            <Text variant='heading' strength='weak'>
              &#8220;{query}&#8221;
            </Text>
          </Flex>
        ) : null
      }
      rightDecorator={categoryRadioGroup}
      variant='main'
    />
  )
}

export const SearchPageV2 = () => {
  const { isMobile } = useMedia()

  const { category, query } = useParams<{
    category: CategoryKey
    query: string
  }>()
  const { history } = useHistoryContext()

  // Set nav header
  const { setLeft, setCenter, setRight } = useContext(NavContext)!
  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(CenterPreset.LOGO)
    setRight(RightPreset.SEARCH)
  }, [setLeft, setCenter, setRight])

  const setCategory = useCallback(
    (category: CategoryKey) => {
      history.push(`/search/${query}/${category}`)
    },
    [history, query]
  )

  const header = (
    <SearchHeader
      query={query}
      title={'Search'}
      category={category as CategoryKey}
      setCategory={setCategory}
    />
  )

  const PageComponent = isMobile ? MobilePageContainer : Page

  return (
    <PageComponent
      title={`${query}`}
      description={`Search results for ${query}`}
      // canonicalUrl={fullSearchResultsPage(query)}
      header={header}
    >
      <Flex direction='column' w='100%'>
        {isMobile ? header : null}
        {!query ? <SearchCatalogTile /> : null}
        {status === Status.LOADING ? <LoadingSpinner /> : <div></div>}
      </Flex>
    </PageComponent>
  )
}
