import { Status } from '@audius/common/models'
import { Maybe } from '@audius/common/utils'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
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
import { ChangeEvent, useCallback } from 'react'

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

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setCategory(value as CategoryKey)
    },
    [setCategory]
  )

  return (
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
      rightDecorator={
        <RadioGroup
          direction='row'
          gap='s'
          aria-label={'Select search category'}
          name='searchcategory'
          value={categoryKey}
          onChange={handleChange}
        >
          {Object.entries(categories).map(([key, category]) => (
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
      }
      variant='main'
    />
  )
}

export const SearchPageV2 = () => {
  const { category, query } = useParams<{
    category: CategoryKey
    query: string
  }>()
  const { history } = useHistoryContext()

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

  return (
    <Page
      title={`${query}`}
      description={`Search results for ${query}`}
      // canonicalUrl={fullSearchResultsPage(query)}
      header={header}
    >
      {status === Status.LOADING ? <LoadingSpinner /> : <div>hi</div>}
    </Page>
  )
}
